import React from 'react';

import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';

import { Line } from 'react-chartjs-2';
import 'chartjs-plugin-annotation';

import { Article } from './PublicTemplates';

const styles = theme => ({
	lineChart: {
		padding: theme.spacing.unit * 2,
	},
	selectModel: {
		paddingLeft: theme.spacing.unit * 2,
		paddingRight: theme.spacing.unit * 2,
	}
});

const data = (modeldata) => {
	let template = {
		datasets: [
			{
				label: "Model Scorea",
				fill: false,
				borderColor: "rgba(0, 123, 255, 1)",
				backgroundColor: "rgba(63, 127, 191, 0.2)",
				data: [],
				pointStyle: 'line'
			},
			{
				label: "Upper confidence interval",
				fill: false,
				borderColor: "rgba(168, 198, 224, 1)",
				data: [],
				pointStyle: 'line'
			},
			{
				label: "Lower confidence interval",
				fill: 1,
				borderColor: "rgba(168, 198, 224, 1)",
				backgroundColor: "rgba(63, 127, 191, 0.2)",
				data: [],
				pointStyle: 'line'
			}
		]
	}
	if (modeldata.datapoints !== undefined) {
		let points = modeldata.datapoints.slice();
		points.forEach(
			datapoint => {
				const date = new Date(Date.parse(datapoint.score_date));
				const dateStr = date.toLocaleDateString(
					'en-GB',
					{ year: 'numeric', month: 'long', day: 'numeric' }
				);
				template.datasets[0].data.push({t: dateStr, y: datapoint.score_value});
				template.datasets[1].data.push({t: dateStr, y: datapoint.confidence_interval_upper});
				template.datasets[2].data.push({t: dateStr, y: datapoint.confidence_interval_lower});
			}
		);
		template.datasets[0].label = modeldata.name;
	}
	return template;
};

const options = (modelname, annotationArr) => {
	return {
		legend: {
			display: false
		},
		title: {
			display: true,
			text: "Model: " + modelname,
			fontSize: 16,
			fontStyle: 'normal'
		},
		scales: {
			yAxes: [
				{
					ticks: {
						beginAtZero: true,
						fontSize: 14
					},
					scaleLabel: {
						display: true,
						labelString: 'Influenza-like illness rate per 100,000 people',
						fontSize: 16
					}
				}
			],
			xAxes: [
				{
					type: 'time',
					time: {
						displayFormats: {
							day: 'D MMM'
						}
					},
					ticks: {
						fontSize: 14
					}
				}
			]
		},
		tooltips: {
			backgroundColor: 'rgba(255,255,255,0.8)',
			bodyFontColor: '#666',
			bodyFontStyle: 'bold',
			titleFontColor: '#666'
		},
		annotation: {
			drawTime: 'afterDatasetsDraw',
			annotations: annotationArr
		}
	}
};

export const generateAnnotations = (thresholddata, maxvalue) => {
	if (thresholddata === undefined) {
		return [];
	}
	const thresholdColours = {
	  low_value: 'green',
		medium_value: 'yellow',
	  high_value: 'orange',
		very_high_value: 'red'
	};
	let annotations = [];
	for (let entry of Object.entries(thresholddata)) {
		if (entry[1].value <= maxvalue) {
			annotations.push(
				{
					type: 'line',
					mode: 'horizontal',
					scaleID: 'y-axis-0',
					value: entry[1].value,
					borderColor: thresholdColours[entry[0]],
					borderWidth: 2,
					label: {
						backgroundColor: 'rgba(0,0,0,0.05)',
						fontColor: '#666',
						position: 'left',
						yAdjust: -10,
						enabled: true,
						content: entry[1].label
					}
				}
			);
		}
	}
	return annotations;
}

export const formatModelname = (modelname, georegion) => {
	const geoCountry = georegion === 'e' ? ' (England)' : '';
	return `${modelname}${geoCountry}`;
}

export const getMaxScoreValue = (datapoints, hasConfidenceInterval) => {
	if (datapoints === undefined) {
		return -Infinity;
	}
	if (hasConfidenceInterval) {
		return Math.max(...datapoints.map(x => x.confidence_interval_upper));
	} else {
		return Math.max(...datapoints.map(x => x.score_value));
	}
}

class ChartComponent extends React.Component {

  render() {

		const { classes, modeldata } = this.props;

		const modelname = formatModelname(modeldata.name,	modeldata.parameters.georegion);
		const maxscorevalue = getMaxScoreValue(modeldata.datapoints, modeldata.hasConfidenceInterval);
		const annotations = generateAnnotations(modeldata.rate_thresholds, maxscorevalue);

		return (
			<Article header="Influenza-like illness rate per day">
				<Grid item xs={12} className={classes.lineChart}>
					<Line data={data(modeldata)} options={options(modelname, annotations)}/>
				</Grid>
				<Grid item xs={12} className={classes.selectModel}>
					<Typography variant="h6">
						Select model to display
					</Typography>
					{this.props.modelcontrols}
				</Grid>
			</Article>
    );
  }

}

export default withStyles(styles)(ChartComponent);
