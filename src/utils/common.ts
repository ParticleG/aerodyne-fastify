import { createHash } from 'crypto';
import { cpu, mem, os } from 'node-os-utils';

async function getSystemInfo() {
  return {
    cpu: {
      cores: cpu.count(),
      model: cpu.model(),
      usage: await cpu.usage(),
    },
    memory: await mem.info(),
    os: {
      arch: os.arch(),
      hostname: os.hostname(),
      name: await os.oos(),
      platform: os.platform(),
    },
  };
}

function md5(text: string) {
  return createHash('md5').update(text).digest('hex');
}

export { getSystemInfo, md5 };
