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

## Race Planning Feature Documentation

### Overview
The Race Planning feature builds upon the Lineup Testing system to create optimized race schedules for championships with multiple races. It ensures fair participation while maximizing overall performance.

### Key Features

1. **Multi-Race Optimization**: Creates race plans for championships with multiple races (1-10 races)

2. **Fair Participation**: Ensures all paddlers race at least a specified minimum number of times

3. **Constraint Satisfaction**: Prevents paddlers from sitting out more than allowed

4. **Score Maximization**: Ranks race plans by total championship score across all races

5. **Compact Display**: Shows sit-out summaries for easy review

6. **Auto-Save**: Automatically saves and ranks all race plans

7. **Detailed Analysis**: Provides participation statistics and paddler rotation details

### How to Use Race Planning

1. **Generate Lineups First**: Use "Test All Lineups" to create a pool of optimized lineups
2. **Configure Race Plan**: Click "Plan Championship" and set:
   - Number of races in the championship
   - Minimum races per paddler
3. **Generate Plans**: The system finds optimal combinations from saved lineups
4. **Review Results**: Browse ranked race plans with participation summaries
5. **View Details**: Examine detailed race breakdowns and paddler rotation
6. **Apply Plans**: Use any race plan's lineup for the current boat

### Race Planning Constraints

- **Number of Races**: Total races in the championship (1-10)
- **Minimum Races per Paddler**: Each paddler must race at least this many times
- **Automatic Validation**: Ensures no paddler sits out more than `(total races - minimum races)`

### Race Plan Ranking

Race plans are ranked by:
1. **Total Score**: Sum of all TT scores across all races (higher is better)
2. **Fairness**: Even distribution of participation
3. **Constraint Satisfaction**: All paddlers meet minimum race requirements

### Sit-Out Display

The compact view shows:
- Which paddlers sit out each race
- Total sit-out count per paddler
- Clear indication of who races when

### Export Functionality

Race plans can be exported as CSV files containing:
- Plan number and race number
- Paddler positions for each race
- Sit-out information
- Full paddler statistics

### Example Workflow

1. Import team data with TT results
2. Use "Test All Lineups" to generate 50+ optimal lineups
3. Click "Plan Championship" for 3 races, minimum 2 races per paddler
4. Review generated race plans ranked by total score
5. Export the top race plan for championship use

### Performance and Optimization

- Uses intelligent search algorithms to find optimal combinations
- Employs constraint satisfaction and early pruning
- Limits computation to prevent browser freezing
- Prioritizes high-scoring lineups for better results

### Sample Test Data

You can test both features with the included sample files:
- `test_paddlers_with_tt.csv`: Paddlers with TT results for scoring
- `test_paddlers_large.csv`: Large team for testing race planning
4. Set weight difference to 5kg and max males to 8
5. Run the test and review results
6. Apply the best lineup and compare with current setup