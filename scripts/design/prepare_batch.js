const fs = require('fs');
const cmds = JSON.parse(fs.readFileSync('scripts/design/docked_sidebar_prototype.json', 'utf8'));
fs.writeFileSync('scripts/design/batch_input.json', JSON.stringify({ commands: cmds, label: 'Build Docked Sidebar App Shell' }));
console.log('batch_input.json created successfully');
