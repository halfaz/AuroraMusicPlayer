const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const mm = require('music-metadata');

const PORT = process.env.PORT || 3000;
const app = express();

app.use(cors());
app.use(express.json());

// Serve static files first
app.use('/music', express.static(path.join(__dirname, 'music')));

// Get music list with metadata
app.get('/music', async (req, res) => {
    const musicFolderPath = path.join(__dirname, 'music');
    
    try {
        const files = fs.readdirSync(musicFolderPath).filter(file => 
            file.endsWith('.mp3') || file.endsWith('.m4a') || file.endsWith('.wav')
        );
        
        const musicFiles = await Promise.all(files.map(async file => {
            const filePath = path.join(musicFolderPath, file);
            try {
                const metadata = await mm.parseFile(filePath);
                const picture = metadata.common.picture?.[0];
                const imageUrl = picture ? 
                    `/cover/${encodeURIComponent(file)}` : null;

                return {
                    name: file,
                    path: `/music/${encodeURIComponent(file)}`,
                    imageUrl,
                    metadata: {
                        title: metadata.common.title || file,
                        artist: metadata.common.artist || 'Unknown Artist',
                        album: metadata.common.album || 'Unknown Album'
                    }
                };
            } catch (err) {
                console.error(`Error processing file ${file}:`, err);
                return {
                    name: file,
                    path: `/music/${encodeURIComponent(file)}`,
                    imageUrl: null,
                    metadata: {
                        title: file,
                        artist: 'Unknown Artist',
                        album: 'Unknown Album'
                    }
                };
            }
        }));
        
        res.json(musicFiles);
    } catch (error) {
        console.error('Error reading music directory:', error);
        res.status(500).json({ error: 'Failed to retrieve music files' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});