const numVariablesInput = document.getElementById('numVariables');
        const numConstraintsInput = document.getElementById('numConstraints');
        const dynamicInputsDiv = document.getElementById('dynamic-inputs');
        const constraintInputsDiv = document.getElementById('constraint-inputs');

        numVariablesInput.addEventListener('input', () => {
    const numVariables = parseInt(numVariablesInput.value);
    if (numVariables !== 2) {
        alert("This solver currently supports only 2 variables!");
        numVariablesInput.value = 2; // Reset to 2
        return;
    }

    dynamicInputsDiv.innerHTML = '';
    dynamicInputsDiv.innerHTML += '<label>Objective Function Coefficients:</label>';
    for (let i = 1; i <= numVariables; i++) {
        dynamicInputsDiv.innerHTML += `<input type="number" name="objVar${i}" placeholder="x${i} coefficient" required>`;
    }
});
 
        // Update inputs dynamically based on the number of variables
        numVariablesInput.addEventListener('input', () => {
            dynamicInputsDiv.innerHTML = '';
            const numVariables = parseInt(numVariablesInput.value);
            if (!numVariables || numVariables < 2) return;
 
            dynamicInputsDiv.innerHTML += '<label>Objective Function Coefficients:</label>';
            for (let i = 1; i <= numVariables; i++) {
                dynamicInputsDiv.innerHTML += `<input type="number" name="objVar${i}" placeholder="x${i} coefficient" required>`;
            }
        });
 
        numConstraintsInput.addEventListener('input', () => {
            constraintInputsDiv.innerHTML = '';
            const numVariables = parseInt(numVariablesInput.value);
            const numConstraints = parseInt(numConstraintsInput.value);
            // Check if the input is empty or not a number before checking for constraints
            if (isNaN(numConstraints) || numConstraints === "") { 
                constraintInputsDiv.innerHTML = '<p class="error">Invalid number of constraints.</p>';
                return; 
              }
  
              if (!numConstraints || numVariables < 2 || numConstraints < 2 || numConstraints > 3) {
                constraintInputsDiv.innerHTML = '<p class="error">Number of constraints must be between 2 and 3.</p>';
                return; 
              }
 
            constraintInputsDiv.innerHTML += '<label>Constraints:</label>';
            for (let i = 1; i <= numConstraints; i++) {
                constraintInputsDiv.innerHTML += `<div><strong>Constraint ${i}:</strong>`;
                for (let j = 1; j <= numVariables; j++) {
                    constraintInputsDiv.innerHTML += `<input type="number" name="constraint${i}Var${j}" placeholder="x${j} coefficient" required>`;
                }
                constraintInputsDiv.innerHTML += `<input type="number" name="constraint${i}RHS" placeholder="RHS" required></div>`;
            }
        });
 
        document.getElementById('lpp-form').addEventListener('submit', (event) => {
            event.preventDefault();
 
            const numVariables = parseInt(numVariablesInput.value);
            const numConstraints = parseInt(numConstraintsInput.value);

            // Check for invalid number of constraints before proceeding
            if (numConstraints < 2 || numConstraints > 3) {
                resultsDiv.innerHTML = '<p class="error">Number of constraints must be between 2 and 3.</p>'; 
                return; 
              }

            const objectiveFunction = [];
            const constraints = [];
            const rhs = [];
 
            try {
                for (let i = 1; i <= numVariables; i++) {
                  objectiveFunction.push(parseFloat(document.querySelector(`input[name="objVar${i}"]`).value));
                }
            
                for (let i = 1; i <= numConstraints; i++) {
                  const coeffs = [];
                  for (let j = 1; j <= numVariables; j++) {
                    coeffs.push(parseFloat(document.querySelector(`input[name="constraint${i}Var${j}"]`).value));
                  }
                  constraints.push(coeffs);
                  rhs.push(parseFloat(document.querySelector(`input[name="constraint${i}RHS"]`).value));
                }
            
                plotGraph(objectiveFunction, constraints, rhs); 
              } catch (error) {
                if (error instanceof TypeError) {
                  resultsDiv.innerHTML = '<p class="error">Invalid input. Please enter valid numbers for coefficients and RHS.</p>';
                } else {
                  resultsDiv.innerHTML = '<p class="error">An unexpected error occurred.</p>';
                  console.error(error); 
                }
              }
            });
            
 
        function calculateIntersection(coeff1, rhs1, coeff2, rhs2) {
            const det = coeff1[0] * coeff2[1] - coeff2[0] * coeff1[1];
            if (det === 0) return null;
 
            const x = (rhs1 * coeff2[1] - rhs2 * coeff1[1]) / det;
            const y = (coeff1[0] * rhs2 - coeff2[0] * rhs1) / det;
 
            return [x, y];
        }
 
        function plotGraph(objectiveFunction, constraints, rhs) {
    const ctx = document.getElementById('lpp-graph').getContext('2d');
    const resultsDiv = document.getElementById('results');

    // Calculate intersection points between constraints
    const points = [];
    for (let i = 0; i < constraints.length; i++) {
        for (let j = i + 1; j < constraints.length; j++) {
            const intersection = calculateIntersection(constraints[i], rhs[i], constraints[j], rhs[j]);
            if (intersection) {
                points.push(intersection);
            }
        }
    }

    // Add intersection points with axes
    constraints.forEach((coeffs, i) => {
        // Intersection with x-axis
        const xIntercept = rhs[i] / coeffs[0];
        if (xIntercept >= 0) points.push([xIntercept, 0]);

        // Intersection with y-axis
        const yIntercept = rhs[i] / coeffs[1];
        if (yIntercept >= 0) points.push([0, yIntercept]);
    });

    // Filter feasible points (inside the feasible region)
    const feasiblePoints = points.filter(([x, y]) =>
        x >= 0 &&
        y >= 0 &&
        constraints.every((coeffs, i) =>
            coeffs.reduce((sum, coeff, index) => sum + coeff * [x, y][index], 0) <= rhs[i]
        )
    );

    // Find optimal points
    let optimalPoints = [];
    let optimalValue = -Infinity;
    feasiblePoints.forEach(([x, y]) => {
        const value = objectiveFunction.reduce((sum, coeff, index) => sum + coeff * [x, y][index], 0);
        if (value > optimalValue) {
            optimalValue = value;
            optimalPoints = [[x, y]]; // Reset to this new maximum value
        } else if (value === optimalValue) {
            optimalPoints.push([x, y]); // Add if same as the current max value
        }
    });

    // Prepare datasets for plotting
    const constraintColors = ['rgba(255, 99, 132, 0.2)', 'rgba(54, 162, 235, 0.2)', 'rgba(255, 206, 86, 0.2)'];
    const datasets = constraints.map((coeffs, i) => {
        const xIntercept = rhs[i] / coeffs[0];
        const yIntercept = rhs[i] / coeffs[1];
        const constraintLine = [
            { x: 0, y: yIntercept },
            { x: xIntercept, y: 0 },
        ];

        return {
            label: `Constraint ${i + 1}`,
            data: constraintLine,
            borderColor: `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.8)`,
            backgroundColor: constraintColors[i],
            fill: true,
            tension: 0,
            showLine: true,
        };
    });

    // Plot feasible points
    const feasiblePointsData = feasiblePoints.map(([x, y], index) => ({
        x: x,
        y: y,
        label: `${String.fromCharCode(65 + index)}(${x.toFixed(2)}, ${y.toFixed(2)})`,
        backgroundColor: optimalPoints.some(point => point[0] === x && point[1] === y) ? 'green' : 'red',
    }));

    // Add origin point (O)
    feasiblePointsData.push({
        x: 0,
        y: 0,
        label: 'O(0, 0)',
        backgroundColor: 'red',
    });

    datasets.push({
        label: 'Feasible Region Points',
        data: feasiblePointsData,
        pointRadius: 5,
        pointStyle: 'circle',
        parsing: {
            xAxisKey: 'x',
            yAxisKey: 'y',
        },
        pointBackgroundColor: ctx => ctx.raw.backgroundColor,
    });

    // Add optimal points as a separate dataset
    datasets.push({
        label: 'Optimal Point(s)',
        data: optimalPoints.map(([x, y]) => ({ x, y })),
        backgroundColor: 'green',
        pointRadius: 6,
        pointStyle: 'circle',
    });

    // Plot using Chart.js
    new Chart(ctx, {
        type: 'scatter',
        data: { datasets },
        options: {
            responsive: true,
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: {
                        display: true,
                        text: 'x-axis',
                    },
                },
                y: {
                    type: 'linear',
                    position: 'left',
                    title: {
                        display: true,
                        text: 'y-axis',
                    },
                },
            },
            plugins: {
                title: {
                    display: true,
                    text: 'The feasible region determined by the system of constraints is given below.',
                    font: {
                        size: 14,
                    },
                },
                legend: {
                    position: 'top',
                },
                tooltip: {
                    enabled: true,
                    callbacks: {
                        label: function (context) {
                            const label = context.dataset.label || '';

                            if (label === 'Optimal Point(s)') {
                                return `Optimal Point: (${context.raw.x.toFixed(2)}, ${context.raw.y.toFixed(2)})`;
                            } else if (label === 'Feasible Region Points') {
                                return context.raw.label;
                            }
                            return label;
                        },
                    },
                },
            },
        },
    });

    // Display results
    resultsDiv.style.display = 'block';
    if (optimalPoints.length > 1) {
        resultsDiv.innerHTML = `<strong>Multiple Optimal Solutions Found.</strong><br>
                         Optimal Value: ${optimalValue.toFixed(2)}<br>
                         Optimal Points: ${optimalPoints
                             .map(point => `(${point[0].toFixed(2)}, ${point[1].toFixed(2)})`)
                             .join(', ')}`;
    } else if (optimalPoints.length === 1) {
        resultsDiv.innerHTML = `<strong>Optimal Solution Found.</strong><br>
                         Optimal Value: ${optimalValue.toFixed(2)}<br>
                         Optimal Point: (${optimalPoints[0][0].toFixed(2)}, ${optimalPoints[0][1].toFixed(2)})`;
    } else {
        resultsDiv.innerHTML = `<strong>No Feasible Solution Found.</strong>`;
    }
}
