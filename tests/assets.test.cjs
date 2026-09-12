const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const sandbox={window:{}};sandbox.window=sandbox;vm.createContext(sandbox);vm.runInContext(fs.readFileSync(path.join(root,'js/config.js'),'utf8'),sandbox);
const {config}=sandbox.MP;
const assets=['backgrounds/moonlit-forest','foregrouds/branches','foregrouds/fog','camera/camera-hand','camera/camera-aim','effects/vanish-particles','ui/coin','ui/film','ui/album-frame',...config.monsters.map(m=>'monsters/'+m.id),...config.equipment.map(e=>'ui/equipment/'+e.id)];
for(const asset of assets){if(!fs.existsSync(path.join(root,'assets/images',asset+'.png')))throw Error('Missing '+asset);}
const sounds=['bgm','shutter','reload','capture-success','perfect-capture','capture-fail','monster-appear','monster-vanish','coin','time-warning','round-clear','round-fail'];
for(const sound of sounds){if(!fs.existsSync(path.join(root,'assets/sounds',sound+'.mp3')))throw Error('Missing '+sound);}
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');for(const match of html.matchAll(/(?:src|href)="(\.\/[^"#]+)"/g)){if(!fs.existsSync(path.resolve(root,match[1])))throw Error('Missing HTML dependency '+match[1]);}
for(const name of fs.readdirSync(path.join(root,'js'))){new vm.Script(fs.readFileSync(path.join(root,'js',name),'utf8'),{filename:name});}
console.log(`PASS ${assets.length} image paths, ${sounds.length} sounds, HTML dependencies, all JavaScript syntax`);
