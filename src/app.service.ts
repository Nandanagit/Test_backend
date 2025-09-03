import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {

  async scrapeWebsite(url: string): Promise<any> {
    const { spawn } = require('child_process');
    const { join } = require('path');
    
    console.log(`[Backend] Starting to scrape URL: ${url}`);
  
    return new Promise((resolve, reject) => {
      try {
        const scriptPath = join(process.cwd(), 'src', 'pup.js');
        console.log(`[Backend] Script path: ${scriptPath}`);
  
        const child = spawn('node', [scriptPath, url], {
          shell: true,
          cwd: process.cwd(),
        });
    
        let output = '';
        let errorOutput = '';
    
        child.stdout.on('data', (data) => {
          const dataStr = data.toString();
          console.log(`[Puppeteer] ${dataStr}`);
          output += dataStr;
        });
    
        child.stderr.on('data', (data) => {
          const errorStr = data.toString();
          console.error(`[Puppeteer Error] ${errorStr}`);
          errorOutput += errorStr;
        });
    
        child.on('close', (code) => {
          console.log(`[Backend] Process exited with code ${code}`);
          if (code === 0) {
            try {
              // Try to parse the output as JSON
              const result = JSON.parse(output);
              resolve(result);
            } catch (e) {
              // If parsing fails, return the raw output
              resolve({ success: true, data: output });
            }
          } else {
            reject(new Error(`Scraping failed with code ${code}: ${errorOutput || 'Unknown error'}`));
          }
        });
      } catch (error) {
        console.error('[Backend] Error in scrapeWebsite:', error);
        reject(error);
      }
    });
  }
}
