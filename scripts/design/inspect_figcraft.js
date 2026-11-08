const fs = require('fs');
const content = JSON.parse(fs.readFileSync('C:/Users/ipan/.gemini/antigravity/brain/a417906f-b329-4ff9-bd23-91ddd4b8d50e/.system_generated/steps/778/output.txt', 'utf8'));
const page = content.pages[0];
console.log('Page background:', page.background);
console.log('Page children count:', page.children.length);
page.children.forEach(c => {
  console.log(`id: ${c.id}, name: "${c.name}", type: ${c.type}, width: ${c.width}, height: ${c.height}`);
});
