import {SoundTouch} from './vendor/soundtouch.js';

// Keep silence on both sides: the overlap windows need input after the last consonant.
export function slowSpeech(mono, hz, rate) {
  const processor = new SoundTouch();
  processor.stretch.setParameters(hz, 55, 16, 8);
  processor.tempo = rate;
  const lead = Math.ceil(hz * 0.08), tail = Math.ceil(hz * 0.22);
  const input = new Float32Array((lead + mono.length + tail) * 2);
  for (let i = 0; i < mono.length; i++) {
    input[(lead+i)*2] = input[(lead+i)*2+1] = mono[i];
  }
  processor.inputBuffer.putSamples(input, 0, input.length / 2);
  processor.process();
  const count = processor.outputBuffer.frameCount, stereo = new Float32Array(count*2);
  processor.outputBuffer.receiveSamples(stereo, count);
  return Float32Array.from({length:count}, (_,i)=>stereo[i*2]);
}

