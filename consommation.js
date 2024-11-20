
// Paramètres principaux
const svg = d3.select("svg"),
      margin = { top: 50, right: 10, bottom: 100, left: 40 },
      width = svg.attr("width") - margin.left - margin.right,
      height = svg.attr("height") - margin.top - margin.bottom,
      radius = Math.min(width, height) / 2;

const chart = svg.append("g")
    .attr("transform", `translate(${margin.left + width / 2},${margin.top + height / 2})`);

const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

// Variables globales
let data, countries, energyTypes, years;
let selectedCountries = new Set();
let selectedEnergy = null;
let selectedYear = null;

// Charger les données
d3.csv("./Ressources/datasets/consommation.csv").then(rawData => {
    data = rawData.map(d => ({
        energy_type: d.energy_type,
        country: d.country,
        year: +d.year,
        consommation: +d.consommation
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

    const pie = d3.pie()
        .value(d => d.consommation)
        .sort(null);

    const arc = d3.arc()
        .outerRadius(radius - 10)
        .innerRadius(0);

    const labelArc = d3.arc()
        .outerRadius(radius - 40)
        .innerRadius(radius - 40);

    chart.selectAll(".arc").remove();

    const g = chart.selectAll(".arc")
        .data(pie(filteredData))
        .enter().append("g")
        .attr("class", "arc");

    g.append("path")
        .attr("d", arc)
        .style("fill", d => colorScale(d.data.country))
        .on("mouseover", function(event, d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", 1);
            tooltip.html(`${d.data.country}<br>${d.data.consommation}<br>
                ${(d.data.consommation / d3.sum(filteredData, d => d.consommation) * 100).toFixed(3)}%`)
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY}px`);
            d3.select(this).classed("highlight", true);
        })
        .on("mouseout", function() {
            tooltip.transition()
                .duration(200)
                .style("opacity", 0);
            d3.select(this).classed("highlight", false);
        });

    g.append("text")
        .attr("transform", d => `translate(${labelArc.centroid(d)})`)
        .attr("dy", ".35em");

    // LÉGENDES
    const totalConsumption = d3.sum(filteredData, d => d.consommation);

    const legendContainer = d3.select("#legend");
    legendContainer.selectAll("*").remove(); // Nettoyer les légendes existantes

    const legend = legendContainer.selectAll(".legend-item")
        .data(filteredData)
        .enter()
        .append("div")
        .attr("class", "legend-item")
        .style("display", "flex")
        .style("align-items", "center")
        .style("margin-bottom", "5px");

    legend.append("div")
        .style("width", "20px")
        .style("height", "20px")
        .style("margin-right", "10px")
        .style("background-color", d => colorScale(d.country));

    legend.append("span")
        .text(d => `${d.country}: ${(d.consommation / totalConsumption * 100).toFixed(3)}%`);
}
