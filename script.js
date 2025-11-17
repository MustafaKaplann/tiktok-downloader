let videoData = null;

// Hata gösterme fonksiyonu
function showError(message) {
    const errorMsg = document.getElementById('errorMsg');
    errorMsg.textContent = message;
    errorMsg.classList.remove('hidden');
    
    setTimeout(() => {
        errorMsg.classList.add('hidden');
    }, 5000);
}

// URL validasyonu
function isValidTikTokUrl(url) {
    const patterns = [
        /tiktok\.com\/@[\w.-]+\/video\/\d+/,
        /vm\.tiktok\.com\/[\w]+/,
        /vt\.tiktok\.com\/[\w]+/,
        /tiktok\.com\/t\/[\w]+/
    ];
    
    return patterns.some(pattern => pattern.test(url));
}

// TikTok video bilgilerini getir
async function fetchVideo() {
    const urlInput = document.getElementById('tiktokUrl');
    const url = urlInput.value.trim();
    
    // URL kontrolü
    if (!url) {
        showError('Lütfen bir TikTok linki girin!');
        return;
    }
    
    if (!isValidTikTokUrl(url)) {
        showError('Geçerli bir TikTok linki girin!');
        return;
    }
    
    // Buton ve loader durumu
    const btn = document.getElementById('downloadBtn');
    const btnText = document.getElementById('btnText');
    const loader = document.getElementById('loader');
    
    btn.disabled = true;
    btnText.classList.add('hidden');
    loader.classList.remove('hidden');
    
    // Önceki sonuçları temizle
    document.getElementById('optionsSection').classList.add('hidden');
    document.getElementById('previewSection').classList.add('hidden');
    document.getElementById('errorMsg').classList.add('hidden');
    
    try {
        // Direkt olarak ücretsiz alternatif API kullan (RapidAPI key gerektirmez)
        // Bu API daha yavaş olabilir ama tamamen ücretsiz ve key gerektirmez
        await fetchWithAlternative(url);
        
    } catch (error) {
        console.error('Hata:', error);
        showError('Video yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
        btn.disabled = false;
        btnText.classList.remove('hidden');
        loader.classList.add('hidden');
    }
}

// Alternatif API yöntemi (RapidAPI key gerektirmeyen)
async function fetchWithAlternative(url) {
    try {
        // Bu API ücretsiz ama bazen yavaş olabilir
        const response = await fetch('https://www.tikwm.com/api/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `url=${encodeURIComponent(url)}`
        });
        
        const data = await response.json();
        
        if (data.code === 0 && data.data) {
            videoData = {
                video: data.data.play,
                videoHD: data.data.hdplay || data.data.play,
                videoWatermark: data.data.wmplay,
                audio: data.data.music,
                cover: data.data.cover,
                title: data.data.title || 'TikTok Video'
            };
            
            displayOptions();
            displayPreview();
        } else {
            throw new Error('Video bulunamadı');
        }
        
    } catch (error) {
        console.error('Alternatif API hatası:', error);
        showError('Video yüklenirken bir hata oluştu. Lütfen linki kontrol edin.');
    } finally {
        const btn = document.getElementById('downloadBtn');
        const btnText = document.getElementById('btnText');
        const loader = document.getElementById('loader');
        
        btn.disabled = false;
        btnText.classList.remove('hidden');
        loader.classList.add('hidden');
    }
}

// Seçenekleri göster
function displayOptions() {
    const optionsSection = document.getElementById('optionsSection');
    optionsSection.classList.remove('hidden');
}

// Önizleme göster
function displayPreview() {
    const previewSection = document.getElementById('previewSection');
    const previewContent = document.getElementById('previewContent');
    
    previewContent.innerHTML = `
        <img src="${videoData.cover}" alt="Video Cover" style="max-width: 100%; border-radius: 8px;">
        <p style="margin-top: 10px; color: #333; font-weight: 500;">${videoData.title}</p>
    `;
    
    previewSection.classList.remove('hidden');
}

// İndirmeyi başlat
async function startDownload() {
    if (!videoData) {
        showError('Önce bir video yükleyin!');
        return;
    }
    
    const selectedType = document.querySelector('input[name="downloadType"]:checked').value;
    let downloadUrl = '';
    let filename = 'tiktok_video';
    
    switch(selectedType) {
        case 'video':
            downloadUrl = videoData.videoWatermark;
            filename = 'tiktok_video_watermark.mp4';
            break;
        case 'nowatermark':
            downloadUrl = videoData.videoHD || videoData.video;
            filename = 'tiktok_video_no_watermark.mp4';
            break;
        case 'audio':
            downloadUrl = videoData.audio;
            filename = 'tiktok_audio.mp3';
            break;
    }
    
    if (!downloadUrl) {
        showError('İndirme linki bulunamadı!');
        return;
    }
    
    // İndirme işlemi
    try {
        const finalBtn = document.getElementById('finalDownloadBtn');
        finalBtn.textContent = '⏳ İndiriliyor...';
        finalBtn.disabled = true;
        
        // Fetch ile veriyi al ve blob olarak indir
        const response = await fetch(downloadUrl);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);
        
        finalBtn.textContent = '✅ İndirildi!';
        
        setTimeout(() => {
            finalBtn.textContent = '💾 İndir';
            finalBtn.disabled = false;
        }, 2000);
        
    } catch (error) {
        console.error('İndirme hatası:', error);
        
        // Doğrudan link ile indir (CORS hatası varsa)
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = filename;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        const finalBtn = document.getElementById('finalDownloadBtn');
        finalBtn.textContent = '💾 İndir';
        finalBtn.disabled = false;
    }
}

// Enter tuşu ile arama
document.addEventListener('DOMContentLoaded', function() {
    const urlInput = document.getElementById('tiktokUrl');
    
    urlInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            fetchVideo();
        }
    });
});
