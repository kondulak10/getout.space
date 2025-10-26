import { useRef, useCallback } from 'react';
import type { HexagonData } from '@/utils/hexagonUtils';

export const useHexagonData = () => {
	const hexDataRef = useRef<Map<string, HexagonData>>(new Map());

	const getHexData = useCallback((hex: string): HexagonData | undefined => {
		return hexDataRef.current.get(hex);
	}, []);

	const clearHexData = useCallback(() => {
		hexDataRef.current.clear();
	}, []);

	return {
		hexDataMap: hexDataRef.current,
		getHexData,
		clearHexData,
	};
};
