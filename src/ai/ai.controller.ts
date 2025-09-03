import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { VeoService } from './veo.service';
import { AiService } from './ai.service';
import { SceneService } from './scene.service';
import type { GenerateScenesOptions, GenerateScenesQuery, GenerateScenesResponse } from './dto/generate-scenes.dto';
import { ApiBody, ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('AI')
@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly sceneService: SceneService,
    private readonly veoService: VeoService,
  ) {}

  @Get('health')
  health() {
    return { status: 'ok', message: this.aiService.getHello() };
  }

  // Document GET query params for Swagger
  
  @ApiQuery({ name: 'numScenes', required: false, type: Number, description: 'Number of scenes (min 3, max 8)' })
  @ApiQuery({ name: 'tone', required: false, type: String, description: 'Tone: exciting | educational | funny | dramatic | professional' })
  @ApiQuery({ name: 'platform', required: false, type: String, description: 'Platform: reels | tiktok | shorts' })
  @ApiQuery({ name: 'maxLinesPerScene', required: false, type: Number, description: 'Max lines per scene (default 3)' })
  @ApiQuery({ name: 'includeCTA', required: false, type: Boolean, description: 'Include a CTA scene (default true)' })
  @ApiQuery({ name: 'language', required: false, type: String, description: 'Language (default en)' })
  @ApiQuery({ name: 'hooksOnly', required: false, type: Boolean, description: 'Only strong hooks per scene (default false)' })
  @ApiQuery({ name: 'title', required: false, type: String, description: 'Optional theme/title' })
  @ApiQuery({ name: 'keywords', required: false, type: String, isArray: true, description: 'Keywords (comma-separated or repeated)' })
  @ApiQuery({ name: 'safeMode', required: false, type: Boolean, description: 'Avoid unsafe claims (default true)' })
  

  @Post('generate-scenes')
  @ApiBody({
    description: 'The request body for generating scenes',
    schema: {
      type: 'object',
      properties: {
        numScenes: { type: 'number', minimum: 3, maximum: 8, description: 'Number of scenes (min 3, max 8)' },
        tone: { type: 'string', enum: ['exciting','educational','funny','dramatic','professional'] },
        platform: { type: 'string', enum: ['reels','tiktok','shorts'] },
        maxLinesPerScene: { type: 'number' },
        includeCTA: { type: 'boolean' },
        language: { type: 'string' },
        hooksOnly: { type: 'boolean' },
        title: { type: 'string' },
        keywords: { type: 'array', items: { type: 'string' } },
        safeMode: { type: 'boolean' },
      },
    },
  })
  async generateScenesPost(
    @Body() options: GenerateScenesOptions = {},
  ): Promise<GenerateScenesResponse> {
    const scenes = await this.sceneService.generateScenes(options);
    return { scenes };
  }

  @Post('generate-veo-video')
  @ApiBody({
    description: 'Generate a video using Veo 3 with the given prompt, url, and userId',
    schema: {
      type: 'object',
      required: ['prompt', 'userId'],
      properties: {
        prompt: { type: 'string', description: 'The prompt for video generation' },
        userId: { type: 'string', description: 'The user ID for video generation' },
      },
    },
  })
  async generateVeoVideo(
    @Body('prompt') prompt: string,
    @Body('userId') userId: string,
  ) {
    if (!prompt) {
      return { error: 'Prompt is required.' };
    }

    if (!userId) {
      return { error: 'userId is required.' };
    }
    
    return this.veoService.makeVideoWithVeo3( userId);
  }
}
