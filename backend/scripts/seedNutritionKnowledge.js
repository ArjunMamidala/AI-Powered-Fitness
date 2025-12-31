import { Pinecone } from "@pinecone-database/pinecone";
import { OpenAI } from "openai/client.js";
import axios from "axios";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Initialize Pinecone and OpenAI clients
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// List of Wikipedia articles related to nutrition science
async function fetchWikipediaArticles() {
    console.log('Step 1: Fetching nutrition articles from Wikipedia...\n');

    const topics = [
        'Protein_(nutrient)',
        'Carbohydrate',
        'Dietary_fiber',
        'Essential_fatty_acid',
        'Calorie_restriction',
        'Ketogenic_diet',
        'Mediterranean_diet',
        'Veganism',
        'Micronutrient',
        'Macronutrient',
        'Sports_nutrition',
        'Vitamin_D',
        "Hydration",
        "Intermittent_fasting",
        "Body_mass_index",
        "Muscle_hypertrophy",
        "Basal_metabolic_rate"
    ]

    const articles = [];

    // Loop through topics and fetch summaries
    for (const topic of topics) {
        try {
            // Wikipedia REST API to get page summary
            const response = await axios.get(
                `https://en.wikipedia.org/api/rest_v1/page/summary/${topic}`,
                {
                    headers: {
                        'User-Agent': 'AI-Powered-Fitness-App/1.0 arjunmamidala88@gmail.com'
                    }
                }
            );

            const data = response.data;
            articles.push({
                title: data.title,
                content: data.extract,
                category: "nutrition-science",
                source: "Wikipedia"
            });

            console.log(`  ✓ Fetched: ${data.title}`);

            // Waiting 100ms between requests to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        catch (error) {
            console.error(`Error fetching article for topic ${topic}: `, error);
        }
    }
    
    console.log(`\n✅ Successfully fetched ${articles.length} articles from Wikipedia\n`);
    return articles;
}

/**
 * Embeds articles and stores them in Pinecone vector database
 * Embeddings convert text into numerical vectors for similarity search
 * Similar text have similar vector representations
 * This allows semantic search based on meaning, not just keywords
 * Example: "high protein diet" and "diet rich in proteins" would have similar embeddings. They don't share words but they are related semantically
 * @param {} articles 
 */
async function generateEmbeddings(articles) {
    console.log('🔄 Step 2: Generating embeddings for articles...\n');
    const vectors = [];

    for (const article of articles) {
        try {
            // Combine the title and content for better context to embed
            // This gives embedding more info to work with
            const embeddingText = `${article.title}\n\n${article.content}`;

            // Call OpenAI's API for embeddings to generate embedding
            // text-embedding-3-small is optimized for text embeddings
            const embeddingResponse = await openai.embeddings.create({
                model: "text-embedding-3-small",
                input: embeddingText,
                dimensions: 1024
            });

            const embedding = embeddingResponse.data[0].embedding;

            // Create a vector object for Pinecone
            vectors.push({
                id: article.title.toLowerCase().split(' ').join('-'), // e.g., "Protein (nutrient)" -> "protein-(nutrient)"
                values: embedding,
                metadata: {
                    text: embeddingText,
                    title: article.title,
                    content: article.content,
                    category: article.category,
                    source: article.source, 
                    url: article.url
                }
            });
            console.log(`  ✓ Embedded: ${article.title}`);
        } catch (error) {
            console.error(`Error generating embedding for article ${article.title}: `, error);
        }
    }

    console.log(`\n✅ Generated ${vectors.length} embeddings\n`);

    return vectors;
}

/**
 * Upload vectors to Pinecone
 * Pinecone is a vector database optimized for similarity search
 * It stores embeddings and retrieves similar ones quickly
 * It's like a google search but for vectors
 * 
 * Steps: 
 * 1. We upload the article embeddings
 * 2. When user asks nutrition question, we embed the question
 * 3. Pinecone finds articles that have similar embeddings
 * 4. We use those articles to augment Gemini's prompt
 * @param {*} vectors 
 */
async function uploadToPinecone(vectors) {
    console.log('🔄 Step 3: Uploading vectors to Pinecone...\n');
    try {
        const index = pinecone.Index("nutrition-knowledge");

        // Upsert means Insert or Update
        // If vector with same ID exists, it updates it
        // Otherwise, it inserts a new vector
        await index.upsert(vectors);

        console.log('✅ Successfully uploaded all vectors to Pinecone!\n');
    }
    catch (error) {
        console.error("Error uploading vectors to Pinecone: ", error);
    }
}

async function seedDatabase() {
    console.log('🌱 SEEDING NUTRITION KNOWLEDGE BASE');
    try {
        const articles = await fetchWikipediaArticles();

        if (articles.length === 0) {
            console.error("No articles fetched. Exiting.");
            return;
        }

        const vectors = await generateEmbeddings(articles);

        if (vectors.length === 0) {
            console.error("No vectors generated. Exiting.");
            return;
        }

        await uploadToPinecone(vectors);

        console.log('✅ SEEDING COMPLETE!');
    }
    catch (error) {
        console.error('\n❌ SEEDING FAILED');
        console.error("Error seeding nutrition knowledge database: ", error);
    }
}

seedDatabase();