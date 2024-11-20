
// Paramètres principaux
const svg = d3.select("svg"),
      margin = { top: 50, right: 30, bottom: 100, left: 60 },
      width = svg.attr("width") - margin.left - margin.right,
      height = svg.attr("height") - margin.top - margin.bottom;

const chart = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3.select(".tooltip");

const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

// Variables globales
let data, countries, energyTypes, years;
let selectedCountries = new Set();
let selectedEnergy = null;
let selectedYear = null;

// Charger les données
d3.csv("./Ressources/datasets/production.csv").then(rawData => {
    data = rawData.map(d => ({
        country: d.country,
        year: +d.year,
        energy_type: d.energy_type,
        production: +d.production
    }));

    // Récupérer les valeurs uniques
    countries = Array.from(new Set(data.map(d => d.country))).sort();
    energyTypes = Array.from(new Set(data.map(d => d.energy_type)));
    years = Array.from(new Set(data.map(d => d.year))).sort();

    // Initialiser les filtres
    selectedCountries = new Set(countries);
    selectedEnergy = energyTypes[0];
    selectedYear = years[0];

    createFilters();
    updateChart();
});

function createFilters() {
    // Filtre des pays
    const countryFilter = d3.select("#country-filter");
    countries.forEach(country => {
        countryFilter.append("label")
            .html(`<input type="checkbox" value="${country}" checked> ${country}<br>`);
    });

    countryFilter.selectAll("input[type=checkbox]")
        .on("change", function() {
            const country = this.value;
            if (this.checked) selectedCountries.add(country);
            else selectedCountries.delete(country);
            updateChart();
        });

    d3.select("#select-all-countries")
        .on("change", function() {
            const checked = this.checked;
            countryFilter.selectAll("input[type=checkbox]").property("checked", checked);
            selectedCountries = checked ? new Set(countries) : new Set();
            updateChart();
        });

    // Filtre des types d'énergie (menu déroulant)
    const energyFilter = d3.select("#energy-select");
    energyTypes.forEach(type => {
        energyFilter.append("option")
            .attr("value", type)
            .text(type);
    });

    energyFilter.on("change", function() {
        selectedEnergy = this.value;
        updateChart();
    });

    // Filtre des années (range)
    const yearRange = d3.select("#year-range");
    const yearValueDisplay = d3.select("#year-value");

    yearRange
        .attr("min", d3.min(years))
        .attr("max", d3.max(years))
        .attr("value", selectedYear);

    yearValueDisplay.text(selectedYear);

    yearRange.on("input", function() {
        selectedYear = +this.value;
        yearValueDisplay.text(selectedYear); // Mettre à jour l'affichage de l'année
        updateChart();
    });
}

function updateChart() {
    const filteredData = data.filter(d => 
        selectedCountries.has(d.country) &&
        d.energy_type === selectedEnergy &&
        d.year === selectedYear
    );

    const x = d3.scaleBand()
        .domain(filteredData.map(d => d.country))
        .range([0, width])
        .padding(0.2);

    const y = d3.scaleLinear()
        .domain([0, d3.max(filteredData, d => d.production)])
        .nice()
        .range([height, 0]);

    chart.selectAll(".bar").remove();
    chart.selectAll(".x-axis").remove();
    chart.selectAll(".y-axis").remove();

    chart.selectAll(".bar")
        .data(filteredData, d => d.country)
        .join("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.country))
        .attr("y", height)
        .attr("width", x.bandwidth())
        .attr("height", 0)
        .attr("fill", d => colorScale(d.country))
        .on("mouseover", function(event, d) {
            tooltip.style("opacity", 1)
                .html(`${d.country}<br>${d.production} `)
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY}px`);
            d3.select(this).classed("highlight", true);
        })
        .on("mouseout", function() {
            tooltip.style("opacity", 0);
            d3.select(this).classed("highlight", false);
        })
        .transition()
        .duration(800)
        .attr("y", d => y(d.production))
        .attr("height", d => height - y(d.production));

    chart.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("dy", ".35em");

    chart.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(y));
}