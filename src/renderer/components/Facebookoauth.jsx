/**
 * Facebook OAuth Handler - Multi App ID (Pilihan A Komersial)
 * Setiap user pakai App ID Facebook mereka sendiri
 */

const { BrowserWindow } = require('electron');
const axios = require('axios');

const REDIRECT_URI = 'https://localhost/callback';
const PERMISSIONS = [
    'pages_show_list',
    'pages_read_engagement',
    'pages_manage_posts',
    'publish_video'
].join(',');

function openFacebookLoginWindow(appId) {
    return new Promise((resolve, reject) => {
        if (!appId || appId.length < 10) {
            return reject(new Error('App ID tidak valid. Pastikan App ID sudah diisi di pengaturan.'));
        }

        const authUrl =
            `https://www.facebook.com/dialog/oauth` +
            `?client_id=${appId}` +
            `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
            `&scope=${encodeURIComponent(PERMISSIONS)}` +
            `&response_type=token` +
            `&display=popup`;

        const loginWindow = new BrowserWindow({
            width: 600,
            height: 700,
            show: true,
            modal: true,
            title: 'Login dengan Facebook',
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                partition: `fb-oauth-${appId}` // partisi per App ID agar tidak bentrok
            }
        });

        loginWindow.loadURL(authUrl);

        loginWindow.webContents.on('will-redirect', (event, url) => {
            handleRedirect(url, loginWindow, resolve, reject);
        });

        loginWindow.webContents.on('will-navigate', (event, url) => {
            handleRedirect(url, loginWindow, resolve, reject);
        });

        loginWindow.on('closed', () => {
            reject(new Error('Login dibatalkan'));
        });
    });
}

function handleRedirect(url, loginWindow, resolve, reject) {
    if (!url.startsWith('https://localhost/callback')) return;
    try {
        const fragment = url.includes('#') ? url.split('#')[1] : url.split('?')[1];
        const params = new URLSearchParams(fragment);
        const accessToken = params.get('access_token');
        const error = params.get('error_description') || params.get('error');

        loginWindow.close();

        if (error) return reject(new Error(error));
        if (!accessToken) return reject(new Error('Access token tidak ditemukan'));

        resolve(accessToken);
    } catch (err) {
        loginWindow.close();
        reject(err);
    }
}

async function getFacebookPages(accessToken) {
    try {
        const response = await axios.get('https://graph.facebook.com/v19.0/me/accounts', {
            params: {
                access_token: accessToken,
                fields: 'id,name,access_token,picture,fan_count,category'
            },
            timeout: 10000
        });

        return (response.data.data || []).map(page => ({
            id: page.id,
            name: page.name,
            pageAccessToken: page.access_token,
            picture: page.picture?.data?.url || null,
            fanCount: page.fan_count || 0,
            category: page.category || ''
        }));
    } catch (err) {
        const msg = err.response?.data?.error?.message || err.message;
        throw new Error('Gagal ambil daftar Page: ' + msg);
    }
}

async function verifyToken(accessToken) {
    try {
        const response = await axios.get('https://graph.facebook.com/v19.0/me', {
            params: { access_token: accessToken, fields: 'id,name' },
            timeout: 5000
        });
        return { valid: true, user: response.data };
    } catch {
        return { valid: false };
    }
}

async function uploadReelToPage({ pageId, pageAccessToken, videoPath, caption, scheduledTime }) {
    const fs = require('fs');

    const initResponse = await axios.post(
        `https://graph.facebook.com/v19.0/${pageId}/video_reels`,
        { upload_phase: 'start', access_token: pageAccessToken },
        { timeout: 15000 }
    );

    const { video_id, upload_url } = initResponse.data;
    if (!upload_url) throw new Error('Gagal mendapatkan upload URL dari Facebook');

    const fileBuffer = fs.readFileSync(videoPath);
    const fileSize = fs.statSync(videoPath).size;

    await axios.post(upload_url, fileBuffer, {
        headers: {
            'Authorization': `OAuth ${pageAccessToken}`,
            'offset': '0',
            'file_size': String(fileSize),
            'Content-Type': 'application/octet-stream'
        },
        timeout: 300000,
        maxContentLength: Infinity,
        maxBodyLength: Infinity
    });

    const publishPayload = {
        upload_phase: 'finish',
        video_id,
        access_token: pageAccessToken,
        video_state: scheduledTime ? 'SCHEDULED' : 'PUBLISHED',
        description: caption || ''
    };

    if (scheduledTime) {
        publishPayload.scheduled_publish_time = Math.floor(scheduledTime / 1000);
    }

    const publishResponse = await axios.post(
        `https://graph.facebook.com/v19.0/${pageId}/video_reels`,
        publishPayload,
        { timeout: 30000 }
    );

    return {
        success: true,
        videoId: video_id,
        postId: publishResponse.data.post_id || video_id,
        url: `https://www.facebook.com/reel/${video_id}`
    };
}

module.exports = {
    openFacebookLoginWindow,
    getFacebookPages,
    verifyToken,
    uploadReelToPage
};
