import React, { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

export default function NutritionPlan() {
  const { getToken } = useAuth();
  
  // State for loading and results
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [metadata, setMetadata] = useState(null);
  
  // State for form data
  const [formData, setFormData] = useState({
    age: '',
    gender: 'male',
    weight: '',
    height: '',
    goalWeight: '',
    activityLevel: 'moderate',
    goal: 'maintain',
    dietaryPreferences: 'none',
    allergies: '',
    mealsPerDay: 3
  });

  /**
   * Handle input changes
   * Updates formData state as user types
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /**
   * Handle form submission
   * Sends data to backend API
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setPlan(null);

    try {
      const token = await getToken();

      const { data } = await axios.post(
        'http://localhost:3105/api/nutrition/generate-plan',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (data.success) {
        setPlan(data.plan);
        setMetadata(data.metadata);
      }
    } catch (error) {
      console.error('Error generating plan:', error);
      alert(error.response?.data?.message || 'Failed to generate plan');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Reset form and plan
   */
  const handleReset = () => {
    setPlan(null);
    setMetadata(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            AI Nutrition Plan Generator
          </h1>
          <p className="text-gray-600">
            Get a personalized 7-day meal plan based on your goals
          </p>
        </div>

        {/* Show form only if no plan generated yet */}
        {!plan && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Age */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Age *
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    required
                    min="13"
                    max="100"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="25"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender *
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Current Weight */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Weight (lbs) *
                  </label>
                  <input
                    type="number"
                    name="weight"
                    value={formData.weight}
                    onChange={handleInputChange}
                    required
                    min="50"
                    max="500"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="180"
                  />
                </div>

                {/* Height */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Height (inches) *
                  </label>
                  <input
                    type="number"
                    name="height"
                    value={formData.height}
                    onChange={handleInputChange}
                    required
                    min="48"
                    max="96"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="70"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    (e.g., 5'10" = 70 inches)
                  </p>
                </div>

                {/* Goal Weight */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Goal Weight (lbs) - Optional
                  </label>
                  <input
                    type="number"
                    name="goalWeight"
                    value={formData.goalWeight}
                    onChange={handleInputChange}
                    min="50"
                    max="500"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="170"
                  />
                </div>

                {/* Activity Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Activity Level *
                  </label>
                  <select
                    name="activityLevel"
                    value={formData.activityLevel}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="sedentary">Sedentary (little/no exercise)</option>
                    <option value="light">Light (1-3 days/week)</option>
                    <option value="moderate">Moderate (3-5 days/week)</option>
                    <option value="active">Active (6-7 days/week)</option>
                    <option value="very_active">Very Active (athlete)</option>
                  </select>
                </div>

                {/* Fitness Goal */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fitness Goal *
                  </label>
                  <select
                    name="goal"
                    value={formData.goal}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="lose">Lose Weight</option>
                    <option value="maintain">Maintain Weight</option>
                    <option value="gain">Gain Muscle</option>
                  </select>
                </div>

                {/* Dietary Preference */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dietary Preference *
                  </label>
                  <select
                    name="dietaryPreferences"
                    value={formData.dietaryPreferences}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="none">No Restrictions</option>
                    <option value="vegetarian">Vegetarian</option>
                    <option value="vegan">Vegan</option>
                    <option value="keto">Keto</option>
                    <option value="paleo">Paleo</option>
                    <option value="mediterranean">Mediterranean</option>
                  </select>
                </div>

                {/* Allergies */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Allergies / Restrictions (optional)
                  </label>
                  <input
                    type="text"
                    name="allergies"
                    value={formData.allergies}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="dairy, gluten, nuts"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Separate multiple items with commas
                  </p>
                </div>

                {/* Meals Per Day */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meals Per Day *
                  </label>
                  <div className="flex gap-3">
                    {[2, 3, 4, 5, 6].map(num => (
                      <label key={num} className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="mealsPerDay"
                          value={num}
                          checked={formData.mealsPerDay === num}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            mealsPerDay: parseInt(e.target.value)
                          }))}
                          className="mr-2"
                        />
                        <span className="text-gray-700">{num}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full mt-8 py-3 px-6 rounded-lg font-semibold text-white transition-colors ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating Your Plan...
                  </span>
                ) : (
                  'Generate My Nutrition Plan'
                )}
              </button>
            </form>
          </div>
        )}

        {/* Generated Plan Display */}
        {plan && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            {/* Metadata */}
            {metadata && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">Your Targets:</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Calories</p>
                    <p className="font-bold text-blue-600">{metadata.targetCalories} kcal</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Protein</p>
                    <p className="font-bold text-green-600">{metadata.proteinGrams}g</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Carbs</p>
                    <p className="font-bold text-orange-600">{metadata.carbsGrams}g</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Fats</p>
                    <p className="font-bold text-purple-600">{metadata.fatsGrams}g</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  Based on {metadata.knowledgeArticles} research articles and {metadata.recipesFound} recipes
                </p>
              </div>
            )}

            {/* The Meal Plan */}
            <div className="prose prose-slate max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({node, ...props}) => (
                    <h1 className="text-3xl font-bold mb-4 text-gray-800 border-b-2 border-gray-200 pb-2" {...props} />
                  ),
                  h2: ({node, ...props}) => (
                    <h2 className="text-2xl font-semibold mb-3 mt-8 text-gray-800" {...props} />
                  ),
                  h3: ({node, ...props}) => (
                    <h3 className="text-xl font-semibold mb-2 mt-6 text-gray-700" {...props} />
                  ),
                  p: ({node, ...props}) => (
                    <p className="mb-3 text-gray-700 leading-relaxed" {...props} />
                  ),
                  ul: ({node, ...props}) => (
                    <ul className="list-disc pl-6 mb-4 space-y-2" {...props} />
                  ),
                  ol: ({node, ...props}) => (
                    <ol className="list-decimal pl-6 mb-4 space-y-2" {...props} />
                  ),
                  li: ({node, ...props}) => (
                    <li className="text-gray-700 leading-relaxed" {...props} />
                  ),
                  strong: ({node, ...props}) => (
                    <strong className="font-bold text-gray-900" {...props} />
                  ),
                }}
              >
                {plan}
              </ReactMarkdown>
            </div>

            {/* Generate New Plan Button */}
            <button
              onClick={handleReset}
              className="mt-8 w-full py-3 px-6 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
            >
              Generate New Plan
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

