const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');

const BUILD_DIR = path.join(__dirname, '../dist');
const INSTALLER_DIR = path.join(__dirname, '../installer');
const RELEASE_DIR = path.join(__dirname, '../releases');

async function clean() {
    console.log('🧹 Cleaning build directories...');
    await fs.remove(BUILD_DIR);
    await fs.remove(RELEASE_DIR);
    await fs.ensureDir(RELEASE_DIR);
}

async function buildElectron() {
    console.log('📦 Building Electron app...');
    execSync('npm run build', { stdio: 'inherit' });
    execSync('npx electron-builder --win --x64', { stdio: 'inherit' });
}

async function downloadFFmpeg() {
    console.log('🎬 Downloading FFmpeg...');
    const ffmpegDir = path.join(BUILD_DIR, 'ffmpeg');
    await fs.ensureDir(ffmpegDir);
    
    // Download FFmpeg Windows build
    const ffmpegUrl = 'https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip';
    const zipPath = path.join(ffmpegDir, 'ffmpeg.zip');
    
    const response = await fetch(ffmpegUrl);
    const buffer = await response.arrayBuffer();
    await fs.writeFile(zipPath, Buffer.from(buffer));
    
    // Extract
    const AdmZip = require('adm-zip');
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(ffmpegDir, true);
    
    // Move ffmpeg.exe to root
    const extracted = fs.readdirSync(ffmpegDir).find(f => f.startsWith('ffmpeg-'));
    if (extracted) {
        await fs.move(
            path.join(ffmpegDir, extracted, 'bin', 'ffmpeg.exe'),
            path.join(ffmpegDir, 'ffmpeg.exe'),
            { overwrite: true }
        );
    }
}

async function downloadPython() {
    console.log('🐍 Downloading Python embed...');
    const pythonDir = path.join(BUILD_DIR, 'python');
    await fs.ensureDir(pythonDir);
    
    const pythonUrl = 'https://www.python.org/ftp/python/3.11.0/python-3.11.0-embed-amd64.zip';
    const zipPath = path.join(pythonDir, 'python.zip');
    
    const response = await fetch(pythonUrl);
    const buffer = await response.arrayBuffer();
    await fs.writeFile(zipPath, Buffer.from(buffer));
    
    // Extract
    const AdmZip = require('adm-zip');
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(pythonDir, true);
    
    // Enable pip (modify python._pth)
    const pthPath = path.join(pythonDir, 'python._pth');
    let pthContent = await fs.readFile(pthPath, 'utf8');
    pthContent = pthContent.replace('#import site', 'import site');
    await fs.writeFile(pthPath, pthContent);
}

async function copyBackend() {
    console.log('📄 Copying Python backend...');
    const backendDest = path.join(BUILD_DIR, 'backend');
    await fs.copy(path.join(__dirname, '../src/backend'), backendDest);
    
    // Create requirements.txt
    const requirements = `requests>=2.31.0
opencv-python>=4.8.0
numpy>=1.24.0
pillow>=10.0.0
pytorch>=2.0.0
torchvision>=0.15.0
transformers>=4.35.0
sentence-transformers>=2.2.0
ffmpeg-python>=0.2.0
yolov5>=7.0.0
easyocr>=1.7.0
tqdm>=4.66.0
    `;
    await fs.writeFile(path.join(backendDest, 'requirements.txt'), requirements);
}

async function createNSISInstaller() {
    console.log('🔧 Creating NSIS installer...');
    execSync('makensis installer/DramaTool.nsi', { stdio: 'inherit' });
}

async function createPortableZip() {
    console.log('📦 Creating portable ZIP...');
    const zipPath = path.join(RELEASE_DIR, 'DramaTool-Portable.zip');
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    output.on('close', () => console.log(`ZIP created: ${zipPath} (${archive.pointer()} bytes)`));
    archive.pipe(output);
    archive.directory(BUILD_DIR, 'DramaTool');
    await archive.finalize();
}

async function main() {
    console.log('🚀 Starting build process for Windows...\n');
    
    await clean();
    await buildElectron();
    await downloadFFmpeg();
    await downloadPython();
    await copyBackend();
    await createNSISInstaller();
    await createPortableZip();
    
    console.log('\n✅ Build complete!');
    console.log(`Installer: ${RELEASE_DIR}/DramaTool-Setup-1.0.0.exe`);
    console.log(`Portable: ${RELEASE_DIR}/DramaTool-Portable.zip`);
}

main().catch(console.error);