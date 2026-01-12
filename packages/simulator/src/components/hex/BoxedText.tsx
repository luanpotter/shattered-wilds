import React from 'react';

export const BoxedText: React.FC<{ x: number; y: number; text: string }> = ({ x, y, text }) => {
	const fontSize = 2.2;
	const w = text.length * (fontSize * 0.6);
	const h = fontSize * 1.4;
	return (
		<>
			<rect x={x - w / 2} y={y - h / 2} width={w} height={h} fill='#333' rx='0.2' />
			<text
				x={x}
				y={y}
				textAnchor='middle'
				dominantBaseline='middle'
				fill='var(--text)'
				fontSize={fontSize}
				style={{
					userSelect: 'none',
					pointerEvents: 'none',
					fontWeight: 'bold',
				}}
			>
				{text}
			</text>
		</>
	);
};
