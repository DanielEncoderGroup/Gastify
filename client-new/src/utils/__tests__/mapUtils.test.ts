import { describe, it, expect } from 'vitest';
import { mapUtils } from '../mapUtils';
import { Coordinates } from '@types/fuel';

describe('mapUtils', () => {
  describe('isValidCoordinates', () => {
    it('should validate correct coordinates', () => {
      // Arrange
      const validCoords = [
        { lat: -33.4489, lng: -70.6693 }, // Santiago
        { lat: -23.6509, lng: -70.3975 }, // Antofagasta
        { lat: -36.8201, lng: -73.0444 }, // Concepción
        { lat: -53.1638, lng: -70.9171 }, // Punta Arenas
        { lat: 0, lng: 0 }, // Null Island (valid but not in Chile)
        { lat: 90, lng: 180 }, // North Pole, Date Line
        { lat: -90, lng: -180 } // South Pole, opposite Date Line
      ];

      // Act & Assert
      validCoords.forEach(coord => {
        expect(mapUtils.isValidCoordinates(coord)).toBe(true);
      });
    });

    it('should invalidate incorrect coordinates', () => {
      // Arrange
      const invalidCoords = [
        { lat: 91, lng: 0 }, // Latitude > 90
        { lat: -91, lng: 0 }, // Latitude < -90
        { lat: 0, lng: 181 }, // Longitude > 180
        { lat: 0, lng: -181 }, // Longitude < -180
        { lat: NaN, lng: 0 }, // NaN latitude
        { lat: 0, lng: NaN }, // NaN longitude
        { lat: Infinity, lng: 0 }, // Infinite latitude
        { lat: 0, lng: -Infinity }, // Infinite longitude
        null as any, // null object
        undefined as any, // undefined object
        {} as any, // empty object
        { lat: 0 } as any, // missing lng
        { lng: 0 } as any // missing lat
      ];

      // Act & Assert
      invalidCoords.forEach(coord => {
        expect(mapUtils.isValidCoordinates(coord)).toBe(false);
      });
    });

    it('should handle edge cases at coordinate boundaries', () => {
      // Arrange
      const boundaryCoords = [
        { lat: 90, lng: 180 }, // Max valid
        { lat: -90, lng: -180 }, // Min valid
        { lat: 89.999999, lng: 179.999999 }, // Almost max
        { lat: -89.999999, lng: -179.999999 } // Almost min
      ];

      // Act & Assert
      boundaryCoords.forEach(coord => {
        expect(mapUtils.isValidCoordinates(coord)).toBe(true);
      });
    });
  });

  describe('isWithinChileBounds', () => {
    it('should validate coordinates within Chile bounds', () => {
      // Arrange
      const chileCoords = [
        { lat: -33.4489, lng: -70.6693 }, // Santiago
        { lat: -23.6509, lng: -70.3975 }, // Antofagasta
        { lat: -36.8201, lng: -73.0444 }, // Concepción
        { lat: -53.1638, lng: -70.9171 }, // Punta Arenas
        { lat: -18.4783, lng: -69.5580 }, // Arica (northern border)
        { lat: -55.9853, lng: -67.2615 }, // Cape Horn area
        { lat: -27.3668, lng: -70.3323 }, // Atacama Desert
        { lat: -41.1335, lng: -71.3103 }  // Bariloche region (Chilean side)
      ];

      // Act & Assert
      chileCoords.forEach(coord => {
        expect(mapUtils.isWithinChileBounds(coord)).toBe(true);
      });
    });

    it('should invalidate coordinates outside Chile bounds', () => {
      // Arrange
      const nonChileCoords = [
        { lat: -34.6037, lng: -58.3816 }, // Buenos Aires, Argentina
        { lat: -15.7942, lng: -47.8822 }, // Brasília, Brazil
        { lat: -12.0464, lng: -77.0428 }, // Lima, Peru
        { lat: -25.2637, lng: -57.5759 }, // Asunción, Paraguay
        { lat: 40.7128, lng: -74.0060 }, // New York, USA
        { lat: 51.5074, lng: -0.1278 }, // London, UK
        { lat: 0, lng: 0 }, // Null Island
        { lat: -16, lng: -68 }, // La Paz, Bolivia (too far east)
        { lat: -33, lng: -55 }, // Montevideo, Uruguay (too far east)
        { lat: -10, lng: -70 } // Too far north (Brazil/Peru region)
      ];

      // Act & Assert
      nonChileCoords.forEach(coord => {
        expect(mapUtils.isWithinChileBounds(coord)).toBe(false);
      });
    });

    it('should handle edge cases at Chile borders', () => {
      // Arrange - These are close to but outside Chile bounds
      const borderCases = [
        { lat: -17, lng: -69 }, // Just north of Chile
        { lat: -56.5, lng: -68 }, // Just south of Chile
        { lat: -30, lng: -67 }, // Just east of Chile
        { lat: -25, lng: -81 } // Just west of Chile (Pacific)
      ];

      // Act & Assert
      borderCases.forEach(coord => {
        const result = mapUtils.isWithinChileBounds(coord);
        expect(typeof result).toBe('boolean');
        // These specific coordinates should be false (outside Chile)
        expect(result).toBe(false);
      });
    });

    it('should handle invalid coordinates gracefully', () => {
      // Arrange
      const invalidCoords = [
        null as any,
        undefined as any,
        { lat: NaN, lng: -70 },
        { lat: -33, lng: NaN },
        {} as any
      ];

      // Act & Assert
      invalidCoords.forEach(coord => {
        expect(mapUtils.isWithinChileBounds(coord)).toBe(false);
      });
    });
  });

  describe('calculateHaversineDistance', () => {
    it('should calculate distance between two points correctly', () => {
      // Arrange
      const santiago: Coordinates = { lat: -33.4489, lng: -70.6693 };
      const lasCondes: Coordinates = { lat: -33.3745, lng: -70.5728 };

      // Act
      const distance = mapUtils.calculateHaversineDistance(santiago, lasCondes);

      // Assert
      // Expected distance is approximately 11-15 km
      expect(distance).toBeGreaterThan(10);
      expect(distance).toBeLessThan(20);
      expect(typeof distance).toBe('number');
      expect(Number.isFinite(distance)).toBe(true);
    });

    it('should return 0 for identical coordinates', () => {
      // Arrange
      const coord: Coordinates = { lat: -33.4489, lng: -70.6693 };

      // Act
      const distance = mapUtils.calculateHaversineDistance(coord, coord);

      // Assert
      expect(distance).toBe(0);
    });

    it('should calculate distance between distant cities', () => {
      // Arrange
      const santiago: Coordinates = { lat: -33.4489, lng: -70.6693 };
      const puntaArenas: Coordinates = { lat: -53.1638, lng: -70.9171 };

      // Act
      const distance = mapUtils.calculateHaversineDistance(santiago, puntaArenas);

      // Assert
      // Expected distance is approximately 2200-2300 km
      expect(distance).toBeGreaterThan(2100);
      expect(distance).toBeLessThan(2400);
    });

    it('should handle coordinates at different hemispheres', () => {
      // Arrange
      const southAmerica: Coordinates = { lat: -33.4489, lng: -70.6693 };
      const northAmerica: Coordinates = { lat: 40.7128, lng: -74.0060 }; // New York

      // Act
      const distance = mapUtils.calculateHaversineDistance(southAmerica, northAmerica);

      // Assert
      // Expected distance is approximately 8000+ km
      expect(distance).toBeGreaterThan(8000);
      expect(distance).toBeLessThan(12000);
    });

    it('should handle edge cases gracefully', () => {
      // Arrange
      const normalCoord: Coordinates = { lat: -33.4489, lng: -70.6693 };
      const edgeCases = [
        { lat: 0, lng: 0 }, // Null Island
        { lat: 90, lng: 0 }, // North Pole
        { lat: -90, lng: 0 }, // South Pole
        { lat: 0, lng: 180 }, // Date Line
        { lat: 0, lng: -180 } // Opposite Date Line
      ];

      // Act & Assert
      edgeCases.forEach(coord => {
        const distance = mapUtils.calculateHaversineDistance(normalCoord, coord);
        expect(typeof distance).toBe('number');
        expect(Number.isFinite(distance)).toBe(true);
        expect(distance).toBeGreaterThanOrEqual(0);
      });
    });

    it('should be symmetric (distance A to B equals distance B to A)', () => {
      // Arrange
      const coordA: Coordinates = { lat: -33.4489, lng: -70.6693 };
      const coordB: Coordinates = { lat: -23.6509, lng: -70.3975 };

      // Act
      const distanceAtoB = mapUtils.calculateHaversineDistance(coordA, coordB);
      const distanceBtoA = mapUtils.calculateHaversineDistance(coordB, coordA);

      // Assert
      expect(distanceAtoB).toBeCloseTo(distanceBtoA, 10);
    });
  });

  describe('formatCoordinates', () => {
    it('should format coordinates with default precision', () => {
      // Arrange
      const coord: Coordinates = { lat: -33.448906, lng: -70.669265 };

      // Act
      const formatted = mapUtils.formatCoordinates(coord);

      // Assert
      expect(formatted).toBe('-33.4489, -70.6693');
    });

    it('should format coordinates with custom precision', () => {
      // Arrange
      const coord: Coordinates = { lat: -33.448906, lng: -70.669265 };

      // Act
      const formatted2 = mapUtils.formatCoordinates(coord, 2);
      const formatted6 = mapUtils.formatCoordinates(coord, 6);

      // Assert
      expect(formatted2).toBe('-33.45, -70.67');
      expect(formatted6).toBe('-33.448906, -70.669265');
    });

    it('should handle zero coordinates', () => {
      // Arrange
      const coord: Coordinates = { lat: 0, lng: 0 };

      // Act
      const formatted = mapUtils.formatCoordinates(coord);

      // Assert
      expect(formatted).toBe('0.0000, 0.0000');
    });

    it('should handle positive coordinates', () => {
      // Arrange
      const coord: Coordinates = { lat: 40.7128, lng: -74.0060 };

      // Act
      const formatted = mapUtils.formatCoordinates(coord);

      // Assert
      expect(formatted).toBe('40.7128, -74.0060');
    });

    it('should handle edge precision values', () => {
      // Arrange
      const coord: Coordinates = { lat: -33.448906, lng: -70.669265 };

      // Act & Assert
      expect(mapUtils.formatCoordinates(coord, 0)).toBe('-33, -71');
      expect(mapUtils.formatCoordinates(coord, 1)).toBe('-33.4, -70.7');
      expect(mapUtils.formatCoordinates(coord, 8)).toBe('-33.44890600, -70.66926500');
    });
  });

  describe('parseCoordinatesString', () => {
    it('should parse valid coordinate strings', () => {
      // Arrange
      const coordStrings = [
        '-33.4489, -70.6693',
        '-33.4489,-70.6693', // No space
        '  -33.4489  ,  -70.6693  ', // Extra spaces
        '40.7128, -74.0060', // Positive latitude
        '0, 0', // Zero coordinates
        '-90, -180', // Extreme values
        '90, 180' // Extreme positive values
      ];

      const expected = [
        { lat: -33.4489, lng: -70.6693 },
        { lat: -33.4489, lng: -70.6693 },
        { lat: -33.4489, lng: -70.6693 },
        { lat: 40.7128, lng: -74.0060 },
        { lat: 0, lng: 0 },
        { lat: -90, lng: -180 },
        { lat: 90, lng: 180 }
      ];

      // Act & Assert
      coordStrings.forEach((coordString, index) => {
        const result = mapUtils.parseCoordinatesString(coordString);
        expect(result).toEqual(expected[index]);
      });
    });

    it('should return null for invalid coordinate strings', () => {
      // Arrange
      const invalidStrings = [
        '', // Empty string
        'invalid', // Not numeric
        '-33.4489', // Missing longitude
        '-33.4489, ', // Empty longitude
        ', -70.6693', // Empty latitude
        '-33.4489, invalid', // Invalid longitude
        'invalid, -70.6693', // Invalid latitude
        '-33.4489, -70.6693, extra', // Too many parts
        '91, 0', // Invalid latitude > 90
        '-91, 0', // Invalid latitude < -90
        '0, 181', // Invalid longitude > 180
        '0, -181', // Invalid longitude < -180
        'NaN, 0', // NaN latitude
        '0, NaN' // NaN longitude
      ];

      // Act & Assert
      invalidStrings.forEach(str => {
        expect(mapUtils.parseCoordinatesString(str)).toBeNull();
      });
    });

    it('should handle null and undefined input', () => {
      // Act & Assert
      expect(mapUtils.parseCoordinatesString(null as any)).toBeNull();
      expect(mapUtils.parseCoordinatesString(undefined as any)).toBeNull();
    });
  });

  describe('getBoundsFromCoordinates', () => {
    it('should calculate bounds from coordinate array', () => {
      // Arrange
      const coordinates: Coordinates[] = [
        { lat: -33.4489, lng: -70.6693 }, // Santiago
        { lat: -33.3745, lng: -70.5728 }, // Las Condes
        { lat: -33.5731, lng: -70.6208 }, // San Bernardo
        { lat: -33.3960, lng: -70.5781 }  // Providencia
      ];

      // Act
      const bounds = mapUtils.getBoundsFromCoordinates(coordinates);

      // Assert
      expect(bounds).toEqual({
        north: -33.3745, // Max latitude
        south: -33.5731, // Min latitude
        east: -70.5728,  // Max longitude
        west: -70.6693   // Min longitude
      });
    });

    it('should handle single coordinate', () => {
      // Arrange
      const coordinates: Coordinates[] = [
        { lat: -33.4489, lng: -70.6693 }
      ];

      // Act
      const bounds = mapUtils.getBoundsFromCoordinates(coordinates);

      // Assert
      expect(bounds).toEqual({
        north: -33.4489,
        south: -33.4489,
        east: -70.6693,
        west: -70.6693
      });
    });

    it('should return null for empty coordinate array', () => {
      // Arrange
      const coordinates: Coordinates[] = [];

      // Act
      const bounds = mapUtils.getBoundsFromCoordinates(coordinates);

      // Assert
      expect(bounds).toBeNull();
    });

    it('should handle coordinates across date line', () => {
      // Arrange
      const coordinates: Coordinates[] = [
        { lat: -33.4489, lng: 179.5 }, // Near date line east
        { lat: -33.3745, lng: -179.5 } // Near date line west
      ];

      // Act
      const bounds = mapUtils.getBoundsFromCoordinates(coordinates);

      // Assert
      expect(bounds).toEqual({
        north: -33.3745,
        south: -33.4489,
        east: 179.5,
        west: -179.5
      });
    });

    it('should filter out invalid coordinates', () => {
      // Arrange
      const coordinates = [
        { lat: -33.4489, lng: -70.6693 }, // Valid
        { lat: NaN, lng: -70.5728 } as Coordinates, // Invalid
        { lat: -33.5731, lng: -70.6208 }, // Valid
        null as any, // Invalid
        { lat: -33.3960, lng: -70.5781 } // Valid
      ];

      // Act
      const bounds = mapUtils.getBoundsFromCoordinates(coordinates);

      // Assert
      // Should only consider the 3 valid coordinates
      expect(bounds).toEqual({
        north: -33.3960,
        south: -33.5731,
        east: -70.5781,
        west: -70.6693
      });
    });
  });

  describe('calculateBoundsPadding', () => {
    it('should add padding to bounds', () => {
      // Arrange
      const bounds = {
        north: -33.3745,
        south: -33.5731,
        east: -70.5728,
        west: -70.6693
      };
      const paddingPercent = 10; // 10%

      // Act
      const paddedBounds = mapUtils.calculateBoundsPadding(bounds, paddingPercent);

      // Assert
      // Calculate expected padding
      const latRange = Math.abs(bounds.north - bounds.south); // 0.1986
      const lngRange = Math.abs(bounds.east - bounds.west); // 0.0965
      const latPadding = latRange * 0.1; // 10% of range
      const lngPadding = lngRange * 0.1;

      expect(paddedBounds.north).toBeCloseTo(bounds.north + latPadding, 4);
      expect(paddedBounds.south).toBeCloseTo(bounds.south - latPadding, 4);
      expect(paddedBounds.east).toBeCloseTo(bounds.east + lngPadding, 4);
      expect(paddedBounds.west).toBeCloseTo(bounds.west - lngPadding, 4);
    });

    it('should handle zero padding', () => {
      // Arrange
      const bounds = {
        north: -33.3745,
        south: -33.5731,
        east: -70.5728,
        west: -70.6693
      };
      const paddingPercent = 0;

      // Act
      const paddedBounds = mapUtils.calculateBoundsPadding(bounds, paddingPercent);

      // Assert
      expect(paddedBounds).toEqual(bounds);
    });

    it('should handle very small bounds with large padding', () => {
      // Arrange
      const smallBounds = {
        north: -33.4489,
        south: -33.4490, // Very small range
        east: -70.6693,
        west: -70.6694   // Very small range
      };
      const paddingPercent = 50; // 50%

      // Act
      const paddedBounds = mapUtils.calculateBoundsPadding(smallBounds, paddingPercent);

      // Assert
      expect(paddedBounds.north).toBeGreaterThan(smallBounds.north);
      expect(paddedBounds.south).toBeLessThan(smallBounds.south);
      expect(paddedBounds.east).toBeGreaterThan(smallBounds.east);
      expect(paddedBounds.west).toBeLessThan(smallBounds.west);
    });
  });

  describe('convertDegreesToRadians', () => {
    it('should convert degrees to radians correctly', () => {
      // Arrange & Act & Assert
      expect(mapUtils.convertDegreesToRadians(0)).toBe(0);
      expect(mapUtils.convertDegreesToRadians(90)).toBeCloseTo(Math.PI / 2, 10);
      expect(mapUtils.convertDegreesToRadians(180)).toBeCloseTo(Math.PI, 10);
      expect(mapUtils.convertDegreesToRadians(360)).toBeCloseTo(2 * Math.PI, 10);
      expect(mapUtils.convertDegreesToRadians(-90)).toBeCloseTo(-Math.PI / 2, 10);
    });
  });

  describe('convertRadiansToDegrees', () => {
    it('should convert radians to degrees correctly', () => {
      // Arrange & Act & Assert
      expect(mapUtils.convertRadiansToDegrees(0)).toBe(0);
      expect(mapUtils.convertRadiansToDegrees(Math.PI / 2)).toBeCloseTo(90, 10);
      expect(mapUtils.convertRadiansToDegrees(Math.PI)).toBeCloseTo(180, 10);
      expect(mapUtils.convertRadiansToDegrees(2 * Math.PI)).toBeCloseTo(360, 10);
      expect(mapUtils.convertRadiansToDegrees(-Math.PI / 2)).toBeCloseTo(-90, 10);
    });
  });

  describe('roundToDecimalPlaces', () => {
    it('should round numbers to specified decimal places', () => {
      // Arrange
      const number = -33.448906789;

      // Act & Assert
      expect(mapUtils.roundToDecimalPlaces(number, 0)).toBe(-33);
      expect(mapUtils.roundToDecimalPlaces(number, 1)).toBe(-33.4);
      expect(mapUtils.roundToDecimalPlaces(number, 2)).toBe(-33.45);
      expect(mapUtils.roundToDecimalPlaces(number, 4)).toBe(-33.4489);
      expect(mapUtils.roundToDecimalPlaces(number, 6)).toBe(-33.448907);
    });

    it('should handle edge cases', () => {
      // Act & Assert
      expect(mapUtils.roundToDecimalPlaces(0, 2)).toBe(0);
      expect(mapUtils.roundToDecimalPlaces(1.999, 2)).toBe(2);
      expect(mapUtils.roundToDecimalPlaces(-1.999, 2)).toBe(-2);
      expect(mapUtils.roundToDecimalPlaces(1.005, 2)).toBe(1.01); // Proper rounding
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle invalid inputs gracefully in distance calculation', () => {
      // Arrange
      const validCoord: Coordinates = { lat: -33.4489, lng: -70.6693 };
      const invalidCoords = [
        null as any,
        undefined as any,
        { lat: NaN, lng: -70.6693 },
        { lat: -33.4489, lng: NaN },
        {} as any
      ];

      // Act & Assert
      invalidCoords.forEach(invalidCoord => {
        expect(() => {
          mapUtils.calculateHaversineDistance(validCoord, invalidCoord);
        }).toThrow();
      });
    });

    it('should validate bounds input in padding calculation', () => {
      // Arrange
      const invalidBounds = [
        null as any,
        undefined as any,
        {} as any,
        { north: -33 } as any, // Missing properties
        { 
          north: NaN, 
          south: -33.5, 
          east: -70.5, 
          west: -70.7 
        } // NaN values
      ];

      // Act & Assert
      invalidBounds.forEach(bounds => {
        expect(() => {
          mapUtils.calculateBoundsPadding(bounds, 10);
        }).toThrow();
      });
    });

    it('should handle extreme coordinate values', () => {
      // Arrange
      const extremeCoords: Coordinates[] = [
        { lat: 90, lng: 180 },
        { lat: -90, lng: -180 },
        { lat: 89.999999, lng: 179.999999 },
        { lat: -89.999999, lng: -179.999999 }
      ];

      // Act & Assert
      extremeCoords.forEach(coord1 => {
        extremeCoords.forEach(coord2 => {
          const distance = mapUtils.calculateHaversineDistance(coord1, coord2);
          expect(typeof distance).toBe('number');
          expect(Number.isFinite(distance)).toBe(true);
        });
      });
    });
  });
});