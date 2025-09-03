import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { Mistral } from '@mistralai/mistralai';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GenerateScenesOptions } from './dto/generate-scenes.dto';
import path from 'path';

type Scene = {
  name: string;
  content: string;
};

@Injectable()
export class SceneService {
  private readonly gemini: GoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new InternalServerErrorException('GEMINI_API_KEY is not set');
    }
    this.gemini = new GoogleGenerativeAI(apiKey);
  }

  status(): string {
    return 'Scene service ready';
  }

  async generateScenes( options: GenerateScenesOptions = {}): Promise<Scene[]> {
    //if (!process.env.MISTRAL_API_KEY) throw new InternalServerErrorException('MISTRAL_API_KEY is not set');

    // Normalize options with defaults
    const numScenes = Math.max(3, Math.min(options.numScenes ?? 3, 8));
    const tone = options.tone ?? 'exciting';
    const platform = options.platform ?? 'reels';
    const maxLinesPerScene = Math.max(1, options.maxLinesPerScene ?? 3);
    const includeCTA = options.includeCTA ?? true;
    const language = options.language ?? 'en';
    const hooksOnly = options.hooksOnly ?? false;
    const title = options.title?.trim();
    const keywords = options.keywords?.filter(Boolean) ?? [];
    const safeMode = options.safeMode ?? true;

    const fs = require('fs');
    const scraped = fs.readFileSync("scraped-content/page_content.txt", "utf-8");




    // 2) Ask Mistral to generate engaging scenes with controls
    const constraints: string[] = [];
    constraints.push(`Platform: ${platform}.`);
    constraints.push(`Tone: ${tone}.`);
    constraints.push(`Language: ${language}.`);
    constraints.push(`Number of scenes: ${numScenes} (minimum 3).`);
    constraints.push(`Each scene must be ${hooksOnly ? 'a strong hook only' : `max ${maxLinesPerScene} lines`} and concise.`);
    if (includeCTA) constraints.push('Add a final scene with a compelling CTA.');
    if (title) constraints.push(`Theme/Title: ${title}.`);
    if (keywords.length) constraints.push(`Incorporate keywords: ${keywords.join(', ')}.`);
    if (safeMode) constraints.push('Avoid unsafe claims; be precise and non-misleading.');

    const productPath = path.resolve(process.cwd(), 'scraped-content/product-images.json');
    const productData = JSON.parse(fs.readFileSync(productPath, 'utf-8'));

    const prompt = [
      "You are a creative video director. Using the provided webpage content and product images, design a captivating short-form video plan.",
      "🎯 Goals: Grab attention fast, tell a mini-story, showcase the product in stylish ways, and end with a strong emotional beat or CTA.",
      "💡 Rules:",
      "- The video must feel cinematic and modern (9:16 vertical format, social media style).",
      "- Scenes should flow like a story (hook → build-up → highlight → finale).",
      "- Use visuals inspired by the given product images (without showing text overlays).",
      "- No subtitles, no captions, no code fences, no prose explanations.",
      "- Only output a JSON array. Required format per scene: { \"name\": string, \"content\": string }.",
      "- Keep each scene description visual, concise, and action-oriented.",
      "📦 Base content:",
      scraped,
      //"🖼️ Product images (inspire your visuals):",
      //productData.map((url: string, idx: number) => `Image ${idx + 1}: ${url}`).join("\n"),
    ].join('');

    const model = this.gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent([
      { text: prompt }
    ]);
    const content = result?.response?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    console.log(content);
    // Gemini may return a string or an array of content chunks
    const raw = Array.isArray(content)
      ? content.map((c: any) => (typeof c.text === 'string' ? c.text : '')).join('').trim()
      : (content as string || '').trim();
    const jsonText = (raw || '[]')
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '');

    let scenes: Scene[] = [];
    try {
      const parsed = JSON.parse(jsonText);
      if (Array.isArray(parsed)) scenes = parsed as Scene[];
      else if (parsed?.scenes && Array.isArray(parsed.scenes)) scenes = parsed.scenes as Scene[];
    } catch (e) {
      throw new InternalServerErrorException('Failed to parse Gemini JSON response');
    }

    if (!Array.isArray(scenes) || scenes.length < 3) {
      throw new InternalServerErrorException('Model returned fewer than 3 scenes');
    }

    // Validate structure
    scenes = scenes.map((scene, i) => ({
      name: scene?.name || `Scene ${i + 1}`,
      content: scene?.content || '',
    }));
    const outputDir = path.resolve(process.cwd(), 'scenes-generated');
    const filePath = path.join(outputDir, 'scenes.json');
    try {
      fs.mkdirSync(outputDir, { recursive: true }); // Ensure outputDir exists
      fs.writeFileSync(
        filePath,
        JSON.stringify(scenes, null, 2)
      );
    } catch (e) {
      throw new InternalServerErrorException('Failed to save generated scenes');
    }

    return scenes;
  }
}
