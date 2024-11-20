// Dimensions
const margin = { top: 50, right: 50, bottom: 50, left: 50 };
const width = 800 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

// Append SVG
const svg = d3.select("#chart")
.append("svg")
.attr("width", width + margin.left + margin.right)
.attr("height", height + margin.top + margin.bottom)
.append("g")
.attr("transform", `translate(${margin.left},${margin.top})`);

// Tooltip
const tooltip = d3.select("body")
.append("div")
.attr("class", "tooltip")
.style("opacity", 0);

// Load data
d3.csv("./Ressources/datasets/prix_gaz.csv").then(data => {
// Parse data and calculate yearly average
const parsedData = d3.group(data.map(d => ({
year: +d.year,
price: +d.price
})), d => d.year);

let averages = Array.from(parsedData, ([year, values]) => ({
year: year,
price: d3.mean(values, d => d.price)
}));

// Sort the averages by year
averages = averages.sort((a, b) => a.year - b.year);

// Scales
const xScale = d3.scaleLinear()
.domain(d3.extent(averages, d => d.year))
.range([0, width]);

const yScale = d3.scaleLinear()
.domain([0, d3.max(averages, d => d.price)])
.range([height, 0]);

// Axes
svg.append("g")
.attr("transform", `translate(0,${height})`)
.call(d3.axisBottom(xScale).ticks(5).tickFormat(d3.format("d")));

svg.append("g")
.call(d3.axisLeft(yScale));

// Line generator
const line = d3.line()
.x(d => xScale(d.year))
.y(d => yScale(d.price))
.curve(d3.curveMonotoneX);

// Draw line
svg.append("path")
.datum(averages)
.attr("class", "line")
.attr("d", line)
.attr("stroke-dasharray", function() {
    return this.getTotalLength();
})
.attr("stroke-dashoffset", function() {
    return this.getTotalLength();
})
.transition()
.duration(2000)
.attr("stroke-dashoffset", 0);

// Add points
svg.selectAll(".dot")
.data(averages)
.enter()
.append("circle")
.attr("class", "dot")
.attr("cx", d => xScale(d.year))
.attr("cy", d => yScale(d.price))
.attr("r", 5)
.on("mouseover", (event, d) => {
    tooltip.transition()
        .duration(200)
        .style("opacity", 0.9);
    tooltip.html(`Year: ${d.year}<br>Price: ${d.price.toFixed(2)}`)
        .style("left", (event.pageX + 5) + "px")
        .style("top", (event.pageY - 28) + "px");
})
.on("mouseout", () => {
    tooltip.transition()
        .duration(500)
        .style("opacity", 0);
});
});