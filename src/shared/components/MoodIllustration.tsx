import Svg, {
  Circle,
  Defs,
  Ellipse,
  LinearGradient,
  Path,
  Stop,
} from 'react-native-svg';

type MoodIllustrationProps = {
  mood: 'empty' | 'error';
  size?: number;
};

export function MoodIllustration({
  mood,
  size = 188,
}: MoodIllustrationProps) {
  const mouthPath =
    mood === 'error'
      ? 'M78 104C84 112 98 112 104 104'
      : 'M79 106C86 110 96 110 103 106';

  return (
    <Svg fill="none" height={size} viewBox="0 0 188 188" width={size}>
      <Defs>
        <LinearGradient id="body" x1="48" x2="134" y1="40" y2="126">
          <Stop offset="0" stopColor="#D9CCFF" />
          <Stop offset="1" stopColor="#9C7DFF" />
        </LinearGradient>
        <LinearGradient id="shell" x1="88" x2="146" y1="80" y2="156">
          <Stop offset="0" stopColor="#636A7C" />
          <Stop offset="1" stopColor="#404552" />
        </LinearGradient>
      </Defs>

      <Path
        d="M44 98C49 83 61 76 70 77C64 86 59 101 59 114C51 111 45 105 44 98Z"
        fill="#FF3D8E"
      />
      <Path
        d="M140 99C136 83 124 76 115 77C121 86 126 102 126 115C134 111 139 106 140 99Z"
        fill="#FF3D8E"
      />

      <Path
        d="M72 112C83 103 104 103 116 112C123 117 128 128 128 140C128 152 118 162 105 162H83C70 162 60 152 60 140C60 128 65 117 72 112Z"
        fill="url(#shell)"
      />

      <Ellipse cx="94" cy="84" fill="url(#body)" rx="46" ry="38" />
      <Ellipse cx="84" cy="63" fill="#C6B7FF" rx="18" ry="10" />

      <Circle cx="70" cy="92" fill="#FF6AA8" r="7" />
      <Circle cx="118" cy="92" fill="#FF6AA8" r="7" />

      <Circle cx="79" cy="88" fill="#465066" r="10" />
      <Circle cx="110" cy="88" fill="#465066" r="10" />
      <Circle cx="76" cy="85" fill="#FFFFFF" r="3" />
      <Circle cx="107" cy="85" fill="#FFFFFF" r="3" />

      <Path
        d="M77 73C80 70 84 70 87 73"
        stroke="#6D7287"
        strokeLinecap="round"
        strokeWidth="4"
      />
      <Path
        d="M101 73C104 70 108 70 111 73"
        stroke="#6D7287"
        strokeLinecap="round"
        strokeWidth="4"
      />
      <Path
        d={mouthPath}
        stroke="#6D7287"
        strokeLinecap="round"
        strokeWidth="4"
      />

      <Path
        d="M57 127C44 140 33 145 18 147"
        stroke="#5E22FF"
        strokeLinecap="round"
        strokeWidth="4"
      />
      <Path
        d="M66 132C56 147 49 157 43 171"
        stroke="#FF3D8E"
        strokeLinecap="round"
        strokeWidth="4"
      />
      <Path
        d="M79 131C74 148 74 161 77 174"
        stroke="#5E22FF"
        strokeLinecap="round"
        strokeWidth="4"
      />
      <Path
        d="M94 132C93 148 98 160 104 172"
        stroke="#A684FF"
        strokeLinecap="round"
        strokeWidth="4"
      />
      <Path
        d="M110 129C112 144 120 156 132 165"
        stroke="#5E22FF"
        strokeLinecap="round"
        strokeWidth="4"
      />
      <Path
        d="M120 123C131 135 140 149 149 167"
        stroke="#FF3D8E"
        strokeLinecap="round"
        strokeWidth="4"
      />

      <Path
        d="M63 122C67 136 68 148 66 161"
        stroke="#BCA9FF"
        strokeLinecap="round"
        strokeWidth="7"
      />
      <Path
        d="M87 128C87 142 83 154 80 164"
        stroke="#D9CCFF"
        strokeLinecap="round"
        strokeWidth="8"
      />
      <Path
        d="M103 128C103 144 107 156 112 167"
        stroke="#D9CCFF"
        strokeLinecap="round"
        strokeWidth="8"
      />

      <Circle cx="80" cy="128" fill="#FF3D8E" r="5" />
      <Circle cx="97" cy="128" fill="#FF3D8E" r="5" />
    </Svg>
  );
}
