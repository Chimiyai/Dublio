//src/lib/AudioProcessor.ts
// Bu, Web Audio API kullanarak ses işlemleri yapacak olan yardımcı sınıfımızdır.
export class AudioProcessor {
    /**
     * Bir AudioBuffer'ı belirli bir aralığını keser.
     * @param originalBuffer Kesilecek orijinal AudioBuffer.
     * @param startSeconds Kesimin başlangıç saniyesi.
     * @param endSeconds Kesimin bitiş saniyesi.
     * @returns Yeni, kesilmiş bir AudioBuffer.
     */
    static async trim(
        originalBuffer: AudioBuffer,
        startSeconds: number,
        endSeconds: number
    ): Promise<AudioBuffer> {
        const sampleRate = originalBuffer.sampleRate;
        const numberOfChannels = originalBuffer.numberOfChannels;
        
        const startOffset = Math.floor(startSeconds * sampleRate);
        const endOffset = Math.floor(endSeconds * sampleRate);
        const frameCount = endOffset - startOffset;

        if (frameCount <= 0) {
            throw new Error("Geçersiz kesim aralığı.");
        }

        const context = new (window.OfflineAudioContext || (window as any).webkitOfflineAudioContext)(
            numberOfChannels,
            frameCount,
            sampleRate
        );

        const newBuffer = context.createBuffer(numberOfChannels, frameCount, sampleRate);

        for (let i = 0; i < numberOfChannels; i++) {
            const channelData = originalBuffer.getChannelData(i);
            const newChannelData = newBuffer.getChannelData(i);
            newChannelData.set(channelData.subarray(startOffset, endOffset));
        }

        return newBuffer;
    }

    /**
     * Bir AudioBuffer'ın başına veya sonuna sessizlik ekler.
     * @param originalBuffer Orijinal AudioBuffer.
     * @param silenceDuration Eklenecek sessizliğin saniye cinsinden süresi.
     * @param position 'start' (başa) veya 'end' (sona).
     * @returns Sessizlik eklenmiş yeni bir AudioBuffer.
     */
    static async addSilence(
        originalBuffer: AudioBuffer,
        silenceDuration: number,
        position: 'start' | 'end'
    ): Promise<AudioBuffer> {
        const sampleRate = originalBuffer.sampleRate;
        const numberOfChannels = originalBuffer.numberOfChannels;
        
        const originalFrameCount = originalBuffer.length;
        const silenceFrameCount = Math.floor(silenceDuration * sampleRate);
        const newFrameCount = originalFrameCount + silenceFrameCount;

        const context = new (window.OfflineAudioContext || (window as any).webkitOfflineAudioContext)(
            numberOfChannels,
            newFrameCount,
            sampleRate
        );

        const newBuffer = context.createBuffer(numberOfChannels, newFrameCount, sampleRate);
        
        for (let i = 0; i < numberOfChannels; i++) {
            const originalChannelData = originalBuffer.getChannelData(i);
            const newChannelData = newBuffer.getChannelData(i);
            
            if (position === 'start') {
                newChannelData.set(originalChannelData, silenceFrameCount);
            } else { // position === 'end'
                newChannelData.set(originalChannelData, 0);
            }
        }
        
        return newBuffer;
    }

    /**
     * Bir AudioBuffer'ı WAV formatında bir Blob'a dönüştürür.
     * @param buffer Dönüştürülecek AudioBuffer.
     * @returns WAV formatında bir Blob.
     */
    static toWavBlob(buffer: AudioBuffer): Promise<Blob> {
        return new Promise(resolve => {
            const numOfChan = buffer.numberOfChannels;
            const length = buffer.length * numOfChan * 2 + 44;
            const bufferArray = new ArrayBuffer(length);
            const view = new DataView(bufferArray);
            const channels = [];
            let i, sample;
            let offset = 0;
            let pos = 0;

            this.setUint32(view, pos, 0x46464952); // "RIFF"
            pos += 4;
            this.setUint32(view, pos, length - 8);
            pos += 4;
            this.setUint32(view, pos, 0x45564157); // "WAVE"
            pos += 4;
            this.setUint32(view, pos, 0x20746d66); // "fmt "
            pos += 4;
            this.setUint32(view, pos, 16);
            pos += 4;
            this.setUint16(view, pos, 1); // PCM
            pos += 2;
            this.setUint16(view, pos, numOfChan);
            pos += 2;
            this.setUint32(view, pos, buffer.sampleRate);
            pos += 4;
            this.setUint32(view, pos, buffer.sampleRate * 2 * numOfChan); // byte rate
            pos += 4;
            this.setUint16(view, pos, numOfChan * 2); // block align
            pos += 2;
            this.setUint16(view, pos, 16); // bits per sample
            pos += 2;
            this.setUint32(view, pos, 0x61746164); // "data"
            pos += 4;
            this.setUint32(view, pos, length - pos - 4);
            pos += 4;

            for (i = 0; i < buffer.numberOfChannels; i++)
                channels.push(buffer.getChannelData(i));

            while (pos < length) {
                for (i = 0; i < numOfChan; i++) {
                    sample = Math.max(-1, Math.min(1, channels[i][offset]));
                    sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
                    view.setInt16(pos, sample, true);
                    pos += 2;
                }
                offset++;
            }
            resolve(new Blob([view], { type: 'audio/wav' }));
        });
    }

    private static setUint16(view: DataView, offset: number, val: number) {
        view.setUint16(offset, val, true);
    }

    private static setUint32(view: DataView, offset: number, val: number) {
        view.setUint32(offset, val, true);
    }
}