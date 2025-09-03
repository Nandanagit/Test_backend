import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { SceneService } from './scene.service';
import { VeoService } from './veo.service';

@Module({
  imports: [],
  controllers: [AiController],
  providers: [AiService, SceneService,VeoService],
  exports: [AiService, SceneService,VeoService],
})
export class AiModule {}
