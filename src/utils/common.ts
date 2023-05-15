import { cpu, mem, os } from 'node-os-utils';

export async function getSystemInfo() {
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

export const getAvatarUrl = (
  id: number,
  size: 0 | 40 | 100 | 140 = 100,
  type: 'user' | 'group' = 'user'
) => {
  switch (type) {
    case 'user':
      return `https://q1.qlogo.cn/g?b=qq&s=${size}&nk=${id}`;
    case 'group':
      return `https://p.qlogo.cn/gh/${id}/${id}/${size}`;
  }
};
