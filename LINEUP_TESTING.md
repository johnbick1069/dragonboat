## Lineup Testing Feature Documentation

### Overview
The Lineup Testing feature generates and evaluates all possible left/right paddler combinations to find the optimal lineup configurations. This is particularly useful when you want to explore different combinations while keeping some paddlers in fixed positions.

### Key Features

1. **Left/Right Assignment Only**: The testing focuses only on which paddlers go on the left vs right side. Row positioning is optimized automatically afterward.

2. **Configurable Constraints**:
   - Maximum weight difference between left and right sides (default: 10kg)
   - Maximum number of male paddlers (default: 10)

3. **Fixed Position Support**: Respects paddlers that are already fixed in specific positions

4. **Automatic Optimization**: After finding valid left/right combinations, automatically optimizes front/back weight distribution (heavy in middle)

5. **TT Score Ranking**: Ranks lineups by sum of TT (Time Trial) results if available

6. **Comprehensive Display**: Shows weight differences, TT scores, gender distribution, and paddlers not in boat

### How to Use

1. **Setup**: Import your team data (including TT results if available) or manually add paddlers
2. **Fix Positions** (optional): Pin specific paddlers to specific seats if needed
3. **Configure**: Click "Test All Lineups" and set your constraints
4. **Generate**: The system will find all valid combinations
5. **Review**: Browse ranked results with detailed statistics
6. **Apply**: Preview or apply any lineup to your boat

### Constraints Explained

- **Weight Difference**: Maximum allowed difference between total left-side and right-side weights
- **Male Paddlers**: Maximum number of male paddlers allowed on the boat (useful for mixed competitions)

### Performance Notes

- For computational efficiency, the system limits the number of combinations processed
- If you have many paddlers, consider fixing some positions to reduce complexity
- The system will warn you if the computation would be too intensive

### Sample Test Data

You can test the feature with the included sample file `test_paddlers_with_tt.csv` which contains paddlers with TT results.

### Example Workflow

1. Import `test_paddlers_with_tt.csv`
2. Add more paddlers to reach 20+ total
3. Fix 2-3 paddlers in specific positions (optional)
4. Set weight difference to 5kg and max males to 8
5. Run the test and review results
6. Apply the best lineup and compare with current setup