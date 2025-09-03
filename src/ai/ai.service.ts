import { Injectable } from '@nestjs/common';

@Injectable()
export class AiService {
  getHello(): string {
    return 'AI service is up';
  }
}
