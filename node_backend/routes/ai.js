const express = require('express');
const router = express.Router();
const { OpenAI } = require('openai');
const { optionalAuth } = require('../middleware/auth');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * @route POST /api/ai/generate-description
 * Generate description using AI based on user prompt
 */
router.post('/generate-description', optionalAuth, async (req, res) => {
  const { prompt, entity_type = 'product', additional_info = {} } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  // If API Key is missing, provide a fallback template
  if (!process.env.OPENAI_API_KEY) {
    let fallback = '';
    if (entity_type === 'product') {
      fallback = `Professional description for ${additional_info.name || 'this product'}. (AI service currently unavailable)`;
    } else if (entity_type === 'requirement') {
      fallback = `Detailed buy requirement for ${additional_info.name || 'this item'}. (AI service currently unavailable)`;
    } else {
      fallback = `Business description for ${additional_info.name || 'this company'}. (AI service currently unavailable)`;
    }
    return res.json({ description: fallback });
  }

  try {
    let systemPrompt = '';
    
    if (entity_type === 'product') {
      const productName = additional_info.name || '';
      const category = additional_info.category || '';
      systemPrompt = `You are a professional product description writer for a B2B marketplace. Write a compelling, professional product description for a B2B audience. Product name: ${productName}. Category: ${category}. User request: ${prompt}. Make it informative, highlight key features and benefits for business buyers.`;
    } else if (entity_type === 'requirement') {
      const productName = additional_info.name || '';
      systemPrompt = `You are a professional B2B procurement specialist. Write a detailed, structured buy requirement (RFQ) description for a B2B marketplace. Product: ${productName}. User context: ${prompt}. Your description should include: 1. General Overview 2. Potential Technical Specifications 3. Quality Standards expected 4. Delivery and Packaging requirements. Make it professional and ready for suppliers to quote on.`;
    } else {
      const companyName = additional_info.name || '';
      const location = additional_info.location || '';
      systemPrompt = `You are a professional business description writer. Write a compelling company description for a B2B marketplace. Company name: ${companyName}. Location: ${location}. User request: ${prompt}. Make it professional, highlight business capabilities, expertise, and value proposition for other businesses.`;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const generatedDescription = response.choices[0].message.content.trim();
    res.json({ description: generatedDescription });

  } catch (error) {
    console.error('[AI Generation Error]', error);
    // Generic fallback on error
    res.json({ 
      description: `Requirement for ${prompt}. (Error connecting to AI service)`,
      error: error.message 
    });
  }
});

module.exports = router;
