import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";
import axios from "axios";
import dotenv from "dotenv";
import { protect } from "../middleware/authMiddleware.js";

// Load environment variables
dotenv.config();

const router = express.Router();

// Initialize Gemini, Pinecone, and OpenAI clients
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);


const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Fallback recipe database for when Spoonacular API is unavailable
const FALLBACK_RECIPES = {
    vegetarian: [
        {
            title: "High-Protein Chickpea Buddha Bowl",
            nutrition: {
                nutrients: [
                    { name: 'Calories', amount: 520 },
                    { name: 'Protein', amount: 24 },
                    { name: 'Carbohydrates', amount: 68 },
                    { name: 'Fat', amount: 16 }
                ]
            }
        },
        {
            title: "Quinoa Black Bean Burrito Bowl",
            nutrition: {
                nutrients: [
                    { name: 'Calories', amount: 485 },
                    { name: 'Protein', amount: 22 },
                    { name: 'Carbohydrates', amount: 72 },
                    { name: 'Fat', amount: 12 }
                ]
            }
        },
        {
            title: "Tofu Scramble with Roasted Vegetables",
            nutrition: {
                nutrients: [
                    { name: 'Calories', amount: 380 },
                    { name: 'Protein', amount: 28 },
                    { name: 'Carbohydrates', amount: 24 },
                    { name: 'Fat', amount: 18 }
                ]
            }
        },
        {
            title: "Lentil Dal with Brown Rice",
            nutrition: {
                nutrients: [
                    { name: 'Calories', amount: 450 },
                    { name: 'Protein', amount: 20 },
                    { name: 'Carbohydrates', amount: 78 },
                    { name: 'Fat', amount: 8 }
                ]
            }
        },
        {
            title: "Mediterranean Chickpea Salad",
            nutrition: {
                nutrients: [
                    { name: 'Calories', amount: 420 },
                    { name: 'Protein', amount: 18 },
                    { name: 'Carbohydrates', amount: 52 },
                    { name: 'Fat', amount: 16 }
                ]
            }
        },
        {
            title: "Tempeh Stir-Fry with Vegetables",
            nutrition: {
                nutrients: [
                    { name: 'Calories', amount: 410 },
                    { name: 'Protein', amount: 26 },
                    { name: 'Carbohydrates', amount: 38 },
                    { name: 'Fat', amount: 18 }
                ]
            }
        },
        {
            title: "Mediterranean Farro Bowl with Roasted Veggies",
            nutrition: {
                nutrients: [
                    { name: 'Calories', amount: 465 },
                    { name: 'Protein', amount: 16 },
                    { name: 'Carbohydrates', amount: 68 },
                    { name: 'Fat', amount: 14 }
                ]
            }
        },
        {
            title: "Black Bean Sweet Potato Tacos",
            nutrition: {
                nutrients: [
                    { name: 'Calories', amount: 395 },
                    { name: 'Protein', amount: 15 },
                    { name: 'Carbohydrates', amount: 62 },
                    { name: 'Fat', amount: 10 }
                ]
            }
        },
        {
            title: "Protein-Packed Overnight Oats",
            nutrition: {
                nutrients: [
                    { name: 'Calories', amount: 425 },
                    { name: 'Protein', amount: 22 },
                    { name: 'Carbohydrates', amount: 58 },
                    { name: 'Fat', amount: 12 }
                ]
            }
        },
        {
            title: "Edamame Quinoa Power Bowl",
            nutrition: {
                nutrients: [
                    { name: 'Calories', amount: 490 },
                    { name: 'Protein', amount: 25 },
                    { name: 'Carbohydrates', amount: 64 },
                    { name: 'Fat', amount: 14 }
                ]
            }
        },
        {
            title: "Spinach and Feta Frittata",
            nutrition: {
                nutrients: [
                    { name: 'Calories', amount: 340 },
                    { name: 'Protein', amount: 24 },
                    { name: 'Carbohydrates', amount: 18 },
                    { name: 'Fat', amount: 20 }
                ]
            }
        },
        {
            title: "Vegetarian Chili with Beans",
            nutrition: {
                nutrients: [
                    { name: 'Calories', amount: 385 },
                    { name: 'Protein', amount: 19 },
                    { name: 'Carbohydrates', amount: 58 },
                    { name: 'Fat', amount: 9 }
                ]
            }
        },
        {
            title: "Greek Yogurt Parfait with Granola",
            nutrition: {
                nutrients: [
                    { name: 'Calories', amount: 380 },
                    { name: 'Protein', amount: 20 },
                    { name: 'Carbohydrates', amount: 54 },
                    { name: 'Fat', amount: 10 }
                ]
            }
        },
        {
            title: "Veggie-Loaded Whole Wheat Pasta",
            nutrition: {
                nutrients: [
                    { name: 'Calories', amount: 475 },
                    { name: 'Protein', amount: 18 },
                    { name: 'Carbohydrates', amount: 76 },
                    { name: 'Fat', amount: 12 }
                ]
            }
        },
        {
            title: "Mushroom and Spinach Quesadilla",
            nutrition: {
                nutrients: [
                    { name: 'Calories', amount: 420 },
                    { name: 'Protein', amount: 21 },
                    { name: 'Carbohydrates', amount: 48 },
                    { name: 'Fat', amount: 16 }
                ]
            }
        }
    ],
    vegan: [
        {
            title: "Vegan Protein Smoothie Bowl",
            nutrition: {
                nutrients: [
                    { name: 'Calories', amount: 450 },
                    { name: 'Protein', amount: 20 },
                    { name: 'Carbohydrates', amount: 62 },
                    { name: 'Fat', amount: 14 }
                ]
            }
        },
        {
            title: "Tofu and Vegetable Stir-Fry",
            nutrition: {
                nutrients: [
                    { name: 'Calories', amount: 395 },
                    { name: 'Protein', amount: 24 },
                    { name: 'Carbohydrates', amount: 42 },
                    { name: 'Fat', amount: 15 }
                ]
            }
        },
        {
            title: "Chickpea Curry with Coconut Milk",
            nutrition: {
                nutrients: [
                    { name: 'Calories', amount: 480 },
                    { name: 'Protein', amount: 18 },
                    { name: 'Carbohydrates', amount: 58 },
                    { name: 'Fat', amount: 20 }
                ]
            }
        },
        {
            title: "Vegan Buddha Bowl with Tahini Dressing",
            nutrition: {
                nutrients: [
                    { name: 'Calories', amount: 510 },
                    { name: 'Protein', amount: 19 },
                    { name: 'Carbohydrates', amount: 68 },
                    { name: 'Fat', amount: 18 }
                ]
            }
        },
        {
            title: "Black Bean and Quinoa Tacos",
            nutrition: {
                nutrients: [
                    { name: 'Calories', amount: 420 },
                    { name: 'Protein', amount: 17 },
                    { name: 'Carbohydrates', amount: 64 },
                    { name: 'Fat', amount: 12 }
                ]
            }
        },
        {
            title: "Lentil Bolognese with Whole Wheat Pasta",
            nutrition: {
                nutrients: [
                    { name: 'Calories', amount: 465 },
                    { name: 'Protein', amount: 21 },
                    { name: 'Carbohydrates', amount: 72 },
                    { name: 'Fat', amount: 10 }
                ]
            }
        },
        {
            title: "Tempeh Power Bowl",
            nutrition: {
                nutrients: [
                    { name: 'Calories', amount: 495 },
                    { name: 'Protein', amount: 28 },
                    { name: 'Carbohydrates', amount: 52 },
                    { name: 'Fat', amount: 18 }
                ]
            }
        },
        {
            title: "Vegan Protein Pancakes",
            nutrition: {
                nutrients: [
                    { name: 'Calories', amount: 380 },
                    { name: 'Protein', amount: 18 },
                    { name: 'Carbohydrates', amount: 58 },
                    { name: 'Fat', amount: 10 }
                ]
            }
        },
        {
            title: "Sweet Potato and Black Bean Bowl",
            nutrition: {
                nutrients: [
                    { name: 'Calories', amount: 445 },
                    { name: 'Protein', amount: 16 },
                    { name: 'Carbohydrates', amount: 72 },
                    { name: 'Fat', amount: 11 }
                ]
            }
        },
        {
            title: "Vegan Chili with Cornbread",
            nutrition: {
                nutrients: [
                    { name: 'Calories', amount: 425 },
                    { name: 'Protein', amount: 19 },
                    { name: 'Carbohydrates', amount: 68 },
                    { name: 'Fat', amount: 9 }
                ]
            }
        }
    ],
    none: [
        {
            title: "Grilled Chicken with Quinoa and Veggies",
            nutrition: {
                nutrients: [
                    { name: 'Calories', amount: 520 },
                    { name: 'Protein', amount: 42 },
                    { name: 'Carbohydrates', amount: 48 },
                    { name: 'Fat', amount: 16 }
                ]
            }
        },
        {
            title: "Salmon Bowl with Brown Rice",
            nutrition: {
                nutrients: [
                    { name: 'Calories', amount: 580 },
                    { name: 'Protein', amount: 38 },
                    { name: 'Carbohydrates', amount: 52 },
                    { name: 'Fat', amount: 22 }
                ]
            }
        },
        {
            title: "Turkey and Sweet Potato Hash",
            nutrition: {
                nutrients: [
                    { name: 'Calories', amount: 465 },
                    { name: 'Protein', amount: 35 },
                    { name: 'Carbohydrates', amount: 48 },
                    { name: 'Fat', amount: 14 }
                ]
            }
        },
        {
            title: "Greek Chicken Salad",
            nutrition: {
                nutrients: [
                    { name: 'Calories', amount: 420 },
                    { name: 'Protein', amount: 38 },
                    { name: 'Carbohydrates', amount: 28 },
                    { name: 'Fat', amount: 18 }
                ]
            }
        },
        {
            title: "Beef and Broccoli Stir-Fry",
            nutrition: {
                nutrients: [
                    { name: 'Calories', amount: 485 },
                    { name: 'Protein', amount: 36 },
                    { name: 'Carbohydrates', amount: 42 },
                    { name: 'Fat', amount: 18 }
                ]
            }
        },
        {
            title: "Grilled Fish Tacos",
            nutrition: {
                nutrients: [
                    { name: 'Calories', amount: 395 },
                    { name: 'Protein', amount: 32 },
                    { name: 'Carbohydrates', amount: 38 },
                    { name: 'Fat', amount: 12 }
                ]
            }
        },
        {
            title: "Chicken Fajita Bowl",
            nutrition: {
                nutrients: [
                    { name: 'Calories', amount: 510 },
                    { name: 'Protein', amount: 40 },
                    { name: 'Carbohydrates', amount: 52 },
                    { name: 'Fat', amount: 16 }
                ]
            }
        },
        {
            title: "Turkey Meatballs with Marinara",
            nutrition: {
                nutrients: [
                    { name: 'Calories', amount: 445 },
                    { name: 'Protein', amount: 38 },
                    { name: 'Carbohydrates', amount: 36 },
                    { name: 'Fat', amount: 16 }
                ]
            }
        },
        {
            title: "Shrimp and Veggie Stir-Fry",
            nutrition: {
                nutrients: [
                    { name: 'Calories', amount: 380 },
                    { name: 'Protein', amount: 34 },
                    { name: 'Carbohydrates', amount: 38 },
                    { name: 'Fat', amount: 10 }
                ]
            }
        },
        {
            title: "Chicken Burrito Bowl",
            nutrition: {
                nutrients: [
                    { name: 'Calories', amount: 525 },
                    { name: 'Protein', amount: 42 },
                    { name: 'Carbohydrates', amount: 56 },
                    { name: 'Fat', amount: 14 }
                ]
            }
        },
        {
            title: "Baked Cod with Roasted Vegetables",
            nutrition: {
                nutrients: [
                    { name: 'Calories', amount: 395 },
                    { name: 'Protein', amount: 36 },
                    { name: 'Carbohydrates', amount: 32 },
                    { name: 'Fat', amount: 12 }
                ]
            }
        },
        {
            title: "Steak and Sweet Potato",
            nutrition: {
                nutrients: [
                    { name: 'Calories', amount: 580 },
                    { name: 'Protein', amount: 44 },
                    { name: 'Carbohydrates', amount: 42 },
                    { name: 'Fat', amount: 24 }
                ]
            }
        },
        {
            title: "Chicken Pesto Pasta",
            nutrition: {
                nutrients: [
                    { name: 'Calories', amount: 545 },
                    { name: 'Protein', amount: 38 },
                    { name: 'Carbohydrates', amount: 58 },
                    { name: 'Fat', amount: 18 }
                ]
            }
        },
        {
            title: "Tuna Poke Bowl",
            nutrition: {
                nutrients: [
                    { name: 'Calories', amount: 465 },
                    { name: 'Protein', amount: 36 },
                    { name: 'Carbohydrates', amount: 52 },
                    { name: 'Fat', amount: 12 }
                ]
            }
        },
        {
            title: "Eggs and Turkey Sausage Breakfast",
            nutrition: {
                nutrients: [
                    { name: 'Calories', amount: 420 },
                    { name: 'Protein', amount: 32 },
                    { name: 'Carbohydrates', amount: 24 },
                    { name: 'Fat', amount: 22 }
                ]
            }
        }
    ]
};

// Helper function to extract nutrient value from recipe nutrition data
function getNutrientValue(recipe, nutrientName) {
    const nutrient = recipe.nutrition?.nutrients?.find(n => n.name === nutrientName);
    return Math.round(nutrient?.amount || 0);
}

/**
 * Convert user's query text into a vector
 * 
 * To search Pinecone, we need to convert the query into a vector and compare those, not raw text.
 * We convert the user's search query into the same format as the stored vectors using OpenAI embeddings.
 * @param {*} text - text to convert into embedding vector
 * @returns {Array} embedding vector
 */
async function getEmbedding(text) {
    // Call OpenAI embeddings API
    const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
        dimensions: 1024
    });
    // Extract the embedding from the response
    return response.data[0].embedding;
}

/**
 * This is the retrieval part of the RAG (Retrieval-Augmented Generation) process.
 * Steps: 
 * 1. Convert the user query into an embedding vector
 * 2. Search Pinecone for similar vectors/articles
 * 3. Return the relevant articles to use in the prompt
 * 4. We extract and return those articles
 * @param {*} query - search query
 * @param {*} topK - number of similar articles to retrieve
 * @returns {Array} - list of relevant articles
 */
async function searchNutritionKnowledge(query, topK = 3) {
    try {
        // Connect to Pinecone index
        const index = pinecone.Index("nutrition-knowledge");

        // Step 1: Get embedding for the query, which makes it easy to compare to the stored article embeddings
        const queryEmbedding = await getEmbedding(query);

        // 2. Query Pinecone for similar vectors
        // Pinecone uses cosine similarity to find the closest matches
        const queryResponse = await index.query({
            vector: queryEmbedding, // Our query as the vector
            topK: topK, // Return the top K most similar articles
            includeMetadata: true // Return the article text and not just the IDs
        });

        // 3. Extract and return the relevant articles from the matches
        return queryResponse.matches.map(match => ({
            title: match.metadata.title,
            content: match.metadata.content,
            category: match.metadata.category,
            source: match.metadata.source,
            url: match.metadata.url,
            score: match.score
        }));
    }
    catch (error) {
        console.error("Error searching nutrition knowledge: ", error);
        return [];
    }
}

async function retrieveRecipesWithFullNutrition(params) {
    try {
        
        // Step 1: Get recipe IDs from search
        const searchResponse = await axios.get(
            'https://api.spoonacular.com/recipes/complexSearch',
            {
                params: {
                    apiKey: process.env.SPOONACULAR_API_KEY,
                    diet: params.diet,
                    intolerances: params.intolerances,
                    maxCalories: params.maxCalories,
                    number: 30, // Request more to account for filtering
                    addRecipeInformation: true
                }
            }
        );

        const recipes = searchResponse.data.results;

        if (recipes.length === 0) {
            const fallbackKey = params.diet || 'none';
            return FALLBACK_RECIPES[fallbackKey]
        }

        // Step 2: Fetch FULL nutrition for each recipe
        
        const recipesWithNutrition = [];
        
        for (const recipe of recipes) {
            try {
                // Call the nutrition widget endpoint
                const nutritionResponse = await axios.get(
                    `https://api.spoonacular.com/recipes/${recipe.id}/nutritionWidget.json`,
                    {
                        params: {
                            apiKey: process.env.SPOONACULAR_API_KEY
                        }
                    }
                );

                const nutritionData = nutritionResponse.data;

                // Parse the nutrition data (Spoonacular returns strings like "15g")
                const nutrients = [
                    { 
                        name: 'Calories', 
                        amount: parseFloat(nutritionData.calories) || 0 
                    },
                    { 
                        name: 'Protein', 
                        amount: parseFloat(nutritionData.protein?.replace('g', '')) || 0 
                    },
                    { 
                        name: 'Carbohydrates', 
                        amount: parseFloat(nutritionData.carbs?.replace('g', '')) || 0 
                    },
                    { 
                        name: 'Fat', 
                        amount: parseFloat(nutritionData.fat?.replace('g', '')) || 0 
                    }
                ];

                // Only add recipe if it has complete nutrition
                const hasCompleteNutrition = nutrients.every(n => n.amount > 0);
                
                if (hasCompleteNutrition) {
                    recipesWithNutrition.push({
                        ...recipe,
                        nutrition: { nutrients }
                    });  
                }

            } catch (error) {
                if (nutritionError.response?.status === 402) {
                    break;
                }
                console.error(`  ✗ Failed to get nutrition for: ${recipe.title}`);
            }
        }

        if (recipesWithNutrition.length === 0) {
            const fallbackKey = params.diet || 'none';
            return FALLBACK_RECIPES[fallbackKey] || FALLBACK_RECIPES.vegetarian;
        }

        // Sort by protein (highest first)
        recipesWithNutrition.sort((a, b) => {
            const proteinA = getNutrientValue(a, 'Protein');
            const proteinB = getNutrientValue(b, 'Protein');
            return proteinB - proteinA;
        });

        return recipesWithNutrition.slice(0, params.number || 20);

    } catch (error) {
        console.error("Error fetching recipes:", error.message);
        const fallbackKey = params.diet || 'none';
        return FALLBACK_RECIPES[fallbackKey] || FALLBACK_RECIPES.vegetarian;
    }
}

// Main route: Generate nutrition plan
router.post('/generate-plan', protect, async (req, res) => {
    try {
        // Extract user input which the frontend is sending to the backend
        const {
            age, 
            gender, 
            weight,
            height,
            goalWeight,
            activityLevel,
            goal,
            dietaryPreferences,
            allergies,
            mealsPerDay
        } = req.body;

        // Validate the input for all the items that are required for the user to en ter
        if (!age || !gender || !weight || !height || !activityLevel || !goal) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide all required fields.' 
            });
        }

        // Calculate BMI using the formula and after converting height and weight to metric units
        const heightInMeters = (height * 2.54) / 100;
        const weightInKg = weight * 0.453592;
        const bmi = (weightInKg / (heightInMeters * heightInMeters)).toFixed(1); 

        // Activity level multipliers that are an indicator of how much the user works out
        const activityMultipliers = { 
            sedentary: 1.15,
            light: 1.35, 
            moderate: 1.55,
            active: 1.75,
            veryActive: 1.95
        };

        /**
         * Calculate BMR using Mifflin-St Jeor Equation
         * 
         * Mens formula: BMR = 10W + 6.25H - 5A + 5
         * Womens formula: BMR = 10W + 6.25H - 5A - 161
         * W = weight in kg, H = height in cm, A = age in years
         * This is important as it tells us how many calories the body needs at rest
         */
        let bmr;
        if (gender === 'male') {
            bmr = (10 * weightInKg) + (6.25 * (height * 2.54)) + (5 * age) + 5
        } else {
            bmr = (10 * weightInKg) + (6.25 * (height * 2.54)) - (5 * age) - 161;
        }

        // Calculate TDEE (Total Daily Energy Expenditure)
        // This is the number of calories burned per day based on activity level
        // This combines the BMR with how much the user moves and exercises
        const tdee = Math.round(bmr * activityMultipliers[activityLevel]);

        // Calculating target calories based on the goals
        let targetCalories;
        if (goal === 'lose') {
            targetCalories = tdee - 500;
        } else if (goal === 'gain') {
            targetCalories = tdee + 500;
        } else {
            targetCalories = tdee;
        }

        // Defining the macronutrient ratios based on the user's goal and dietary preferences
        let macroRatios;
        if (goal === 'gain') {
            // Muscle gain: Higher protein
            if (dietaryPreferences === 'vegetarian' || dietaryPreferences === 'vegan') {
                // Vegetarian/vegan: realistic protein target
                macroRatios = { protein: 0.25, carbs: 0.45, fats: 0.30 };
            } else {
                // Omnivore: higher protein is easier
                macroRatios = { protein: 0.35, carbs: 0.35, fats: 0.30 };
            }
        } else if (goal === 'lose') {
            macroRatios = { protein: 0.35, carbs: 0.40, fats: 0.25 };
        } else {
            macroRatios = { protein: 0.30, carbs: 0.40, fats: 0.30 };
        }

        const proteinGrams = Math.round((targetCalories * macroRatios.protein) / 4);
        const carbsGrams = Math.round((targetCalories * macroRatios.carbs) / 4);
        const fatsGrams = Math.round((targetCalories * macroRatios.fats) / 9);

        // Crate a search string that will find relevant articles related to nutrition
        // This is the retrieval part of RAG
        let goalKeywords;
        if (goal === 'lose') {
            goalKeywords = 'weight loss, fat burning, calorie deficit';
        } else if (goal === 'gain') {
            goalKeywords = 'muscle gain, weight gain, calorie surplus, protein';
        } else {
            goalKeywords = 'weight maintenance, balanced diet, healthy eating';
        }

        let dietKeywords = '';
        if (dietaryPreferences && dietaryPreferences.length > 0) {
            dietKeywords = dietaryPreferences;
        }

        let allergyKeywords = '';
        if (allergies && allergies.length > 0) {
            allergyKeywords = allergies
        }

        // This is the full search query that we will embed and send to Pinecone to compare with articles
        const searchQuery = `nutrition plan for ${goal}. Key topics: ${goalKeywords}. ${dietKeywords} ${allergyKeywords}`;

        // Search Pinecone for relevant nutrition articles that have similar embeddings
        const relevantArticles = await searchNutritionKnowledge(searchQuery, 3);

        // Map dietary preferences to Spoonacular diet parameters
        const diets = {
            vegetarian: 'vegetarian',
            vegan: 'vegan',
            keto: 'ketogenic',
            paleo: 'paleolithic',
            glutenFree: 'gluten free'
        }

        // Fetch recipes from Spoonacular that match user's dietary needs
        const recipes = await retrieveRecipesWithFullNutrition({
            diet: diets[dietaryPreferences] || '',
            intolerances: allergies || null,
            maxCalories: targetCalories,
            number: 50, 
            addRecipeInformation: true, 
            fillIngredients: true
        });

        // Format research articles for the prompt
        let researchSection = '**RESEARCH-BACKED NUTRITION KNOWLEDGE:**\n';
        for (let i = 0; i < relevantArticles.length; i++) {
            researchSection += `\n${i + 1}. ${relevantArticles[i].title}\n${relevantArticles[i].content}\n`;
        }

        let recipesSection = '**REAL RECIPES AVAILABLE:**\n';

        const recipesToShow = recipes.slice(0, 15); // Show top 15 recipes
        for (let i = 0; i < recipesToShow.length; i++) {
            const recipe = recipesToShow[i];
            
            // Extract ALL macronutrients using the helper function
            const calories = getNutrientValue(recipe, 'Calories');
            const protein = getNutrientValue(recipe, 'Protein');
            const carbs = getNutrientValue(recipe, 'Carbohydrates');
            const fats = getNutrientValue(recipe, 'Fat');
            
            // Show complete nutrition data to Gemini
            recipesSection += `\n${i + 1}. ${recipe.title}\n`;
            recipesSection += `   - Calories: ~${calories} kcal | Protein: ~${protein}g | Carbs: ~${carbs}g | Fats: ~${fats}g\n`;
        }

        // Convert the goal of lose/gain/maintain into a user-friendly phrase
        let goalPhrase;
        if (goal === 'lose') {
            goalPhrase = 'lose weight';
        } else if (goal === 'gain') {
            goalPhrase = 'gain weight';
        } else {
            goalPhrase = 'maintain your weight';
        }

        // Convert dietary preferences array into a readable string
        let dietaryDisplay;
        if (dietaryPreferences === 'none' || !dietaryPreferences) {
            // If user selected "none" or didn't select anything
            dietaryDisplay = 'No restrictions';
        } else {
            // Use whatever they selected (keto, vegan, etc.)
            dietaryDisplay = dietaryPreferences;
        }

        // Build the optional line for goal weight
        // Show the goal weight only if the user provided it
        let goalWeightLine = '';
        if (goalWeight) {
            goalWeightLine = `Goal: Aim to reach ${goalWeight} lbs`;
        }

        // Show allergies if user provided them
        let allergiesLine = '';
        if (allergies && allergies.length > 0) {
            allergiesLine = `Allergies/Intolerances: ${allergies}`;
        }

        // Show the snack placeholder if the user wants more than 3 meals
        let snackPlaceholder = '';
        if (mealsPerDay && mealsPerDay > 3) {
            snackPlaceholder = '\n- Snack: [Your choice of healthy snack]';
        }

        /**
         * Combine everything into one big prompt for Gemini
         * 
         * This is the "Augmented Generation" part of RAG
         * We're augmenting Gemini's prompt with relevant articles and real recipes
         */

        const prompt = `You are a certified nutritionist and dietitian. Generate the response using **proper Markdown formatting** for headings, bold text, and lists.
        
        Using the information provided, create a personalized daily nutrition plan.
        ${researchSection}
        ${recipesSection}
        
        User Details:
        - Age: ${age}
        - Gender: ${gender}
        - Weight: ${weight} lbs
        - Height: ${height} inches
        - ${goalWeightLine}
        - Activity Level: ${activityLevel}
        - Goal: ${goalPhrase}
        - Dietary Preferences: ${dietaryDisplay}
        - ${allergiesLine}
        - Target Daily Calories: ~${targetCalories} kcal
        - Meals Per Day: ${mealsPerDay || 3}

        Macronutrient Breakdown:
        - Protein: ~${proteinGrams}g
        - Carbohydrates: ~${carbsGrams}g
        - Fats: ~${fatsGrams}g

        **Instructions:**
        1. Create a daily meal plan with breakfast, lunch, dinner, and${snackPlaceholder}.
        2. Each meal should include a recipe from the provided recipes list.
        3. Ensure the total daily calories align with the target of ~${targetCalories} kcal.
        4. Distribute macronutrients according to the calculated grams.
        5. Provide portion sizes for each meal.
        6. Use a friendly and encouraging tone suitable for someone looking to ${goalPhrase}.
        7. Format the meal plan clearly for easy reading.
        8. Cite the sources of recipes used from the provided list.
        
        Generate the personalized nutrition plan now.

        **Format**
        # Your Personalized Nutrition Plan

        ## Summary
        [Brief overview based on research]

        ## Daily Targets
        - Calories: ${targetCalories} kcal
        - Macros: ${proteinGrams}g | Carbs: ${carbsGrams}g | Fats: ${fatsGrams}g

        ## 7-Day Meal Plan

        ### Day 1
        **Breakfast:** [Meal name]
        - [Description]
        - Calories: ~XXX | Protein: XXg | Carbs: XXg | Fats: XXg

        **Lunch:** [Meal name]
        - [Description]
        - Calories: ~XXX | Protein: XXg | Carbs: XXg | Fats: XXg

        **Dinner:** [Meal name]
        - [Description]
        - Calories: ~XXX | Protein: XXg | Carbs: XXg | Fats: XXg

        ${snackPlaceholder}**Daily Total:** ~${targetCalories} kcal

        [Repeat for Days 2-7]

        ## Tips for Success
        [5 practical tips based on research]

        Keep it concise, practical, and encouraging!
        `

        // Call Gemini to generate the nutrition plan

        // Gets the model and this creates a connection to the 2.5 Flash model
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash-lite',  // Model being used
            generationConfig: {
                maxOutputTokens: 8000, // Max length of response
                temperature: 0.7,      // Creativity of response
                topP: 0.9,             // Nucleus sampling parameter
            }
        })

        // Generates the content and this sends the prompt to Google's servers and waits for a response
        const result = await model.generateContent(prompt);

        // Extract the response text from the result
        const response = result.response;

        // Get the text of the response
        const nutritionPlan = response.text();

        // Return the nutrition plan and calculations to the user
        res.status(200).json({
            success: true,
            plan: nutritionPlan,
            metadata: {
                proteinGrams,
                carbsGrams,
                fatsGrams,
                bmi,
                bmr,
                tdee,
                targetCalories,
            }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server Error: Unable to generate nutrition plan.'
        });
        console.error("Error generating nutrition plan: ", error);
    }
})

export default router;