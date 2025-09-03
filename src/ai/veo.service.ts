import { Injectable } from '@nestjs/common';
import { GoogleGenAI, PersonGeneration } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class VeoService {
  constructor() {}

  async makeVideoWithVeo3(userId: string): Promise<any> {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY as string,
    });

    // Ensure video dir exists
    const videoDir = path.join(process.cwd(), 'video');
    if (!fs.existsSync(videoDir)) {
      fs.mkdirSync(videoDir);
    }

    const results: any[] = [];
    const savedVideoPaths: string[] = [];

    // Load scenes
    const filePath = path.resolve(process.cwd(), 'scenes-generated/scenes.json');
    const scenesData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    // Load product images
    const productPath = path.resolve(process.cwd(), 'scraped-content/product-images.json');
    const productData = JSON.parse(fs.readFileSync(productPath, 'utf-8')); 
    // Expecting something like: [ "url1", "url2", ... ] or [{url:"..."}, ...]

    for (const [i, scene] of scenesData.entries()) {
      const prompt = scene.content || '';
      console.log(`🎬 Generating for scene ${i + 1}: ${prompt}`);

      // Pick one or more product images (example: rotate through them)
      const imageIndex = i % productData.length;
      const productImage =
        typeof productData[imageIndex] === 'string'
          ? productData[imageIndex]
          : productData[imageIndex].url;

      // ✅ Generate video with text prompt + image reference
      let operation = await ai.models.generateVideos({
        model: 'veo-2.0-generate-001',
        prompt: `${prompt}\nInclude visuals inspired by this product image: ${productImage}`,
        config: {
          numberOfVideos: 1,
          aspectRatio: '9:16',
          durationSeconds: 8,
          personGeneration: PersonGeneration.ALLOW_ALL,
        },
        // Some SDKs support an `images` field; if available, use:
        // images: [productImage],
      });

      // Poll until video is ready
      while (!operation.done) {
        await new Promise((resolve) => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({
          operation: operation,
        });
      }

      // Save all generated videos for this scene
      for (const [j, generatedVideo] of (operation.response?.generatedVideos ?? []).entries()) {
        const videoFile = generatedVideo?.video;
        if (videoFile) {
          const fileName = `video_${userId}_${Date.now()}_${i}_${j}.mp4`;
          const fileOut = path.join(videoDir, fileName);

          if (typeof ai.files?.download === 'function') {
            await ai.files.download({
              file: videoFile,
              downloadPath: fileOut,
            });
          } else {
            throw new Error('ai.files.download is not available in this SDK');
          }

          results.push({
            scene: scene.name || `scene_${i}`,
            localPath: fileOut,
            //imageUsed: productImage,
          });
          savedVideoPaths.push(fileOut);
        }
      }
    }

    // Optionally save in DB
    // await this.mongService.upsertContent({ video_location: savedVideoPaths });

    return { count: results.length, videos: results };
  }
}
