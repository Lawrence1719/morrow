export interface MoodStyle {
  color: string;
  bg: string;
  border: string;
  pulse: string;
  label: string;
  emoji: string;
  gradient: string;
}

export const MOOD_STYLES: Record<string, MoodStyle> = {
  happy: {
    color: '#c9a96e', // Aged Gold
    bg: 'bg-[#d9c5a0]',
    border: 'border-[#c9a96e]',
    pulse: 'bg-[#d9c5a0]/60',
    label: 'Happy',
    emoji: '☀️',
    gradient: 'from-[#e3d3b4] to-[#c9a96e]'
  },
  sad: {
    color: '#64748b', // Slate Blue
    bg: 'bg-[#94a3b8]',
    border: 'border-[#64748b]',
    pulse: 'bg-[#94a3b8]/60',
    label: 'Sad',
    emoji: '🌊',
    gradient: 'from-[#abb8c9] to-[#64748b]'
  },
  peaceful: {
    color: '#7d9373', // Sage Green
    bg: 'bg-[#a3b899]',
    border: 'border-[#7d9373]',
    pulse: 'bg-[#a3b899]/60',
    label: 'Peaceful',
    emoji: '🌿',
    gradient: 'from-[#bad0b0] to-[#7d9373]'
  },
  anxious: {
    color: '#b87c7c', // Dusty Rose / Terracotta
    bg: 'bg-[#d4a5a5]',
    border: 'border-[#b87c7c]',
    pulse: 'bg-[#d4a5a5]/60',
    label: 'Anxious',
    emoji: '🍂',
    gradient: 'from-[#ebbdbd] to-[#b87c7c]'
  },
  dreamy: {
    color: '#9c89a4', // Pale Plum / Muted Lavender
    bg: 'bg-[#c5b5c9]',
    border: 'border-[#9c89a4]',
    pulse: 'bg-[#c5b5c9]/60',
    label: 'Dreamy',
    emoji: '🌌',
    gradient: 'from-[#dccce0] to-[#9c89a4]'
  }
};
