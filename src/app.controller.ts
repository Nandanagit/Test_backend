import { Controller, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiBody } from '@nestjs/swagger';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('scrape-website')  // ✅ changed to GET
  @ApiBody({ required: true, description: 'URL to scrape' })
  async scrape(@Body() body: { url: string }) {
    try {
      const data = await this.appService.scrapeWebsite(body.url);
      // const audio = await this.appService.textForAudio();
      // const speech = await this.appService.toSpeech();
      // const subtitle = await this.appService.subtitles();
// if (
//   data !== undefined && data !== null &&
//   audio !== undefined && audio !== null &&
//   speech !== undefined && speech !== null &&
//   subtitle !== undefined && subtitle !== null
// ) {
  return { success: true, message: "scraped successfully" };
//   return { success: true, message: "Video Successfully Rendered" };
//}
    //   return { success: false, message: "Error while rendering video " };
     } catch (error) {
       return { success: false, message: "An error occurred", error: error.message };
     }
  }


}
