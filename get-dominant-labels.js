
const videoAnnotations = require('./data/FO-2A9RJC59T1114_proxy_normal - 1679579326.476749.json');


function convertTimestampToNumber(timestamp) {
    return (timestamp.seconds ?? 0) + (timestamp.nanos ?? 0) / 1000000000;
}

function calculateSegmentDuration(segment) {
    return convertTimestampToNumber(segment.end_time_offset) - convertTimestampToNumber(segment.start_time_offset);
}

function getSegmentDurations(shotLabel) {
    return shotLabel.segments.map(s => calculateSegmentDuration(s.segment))
}

function getFullDuration(shotLabel) {
    const sum = getSegmentDurations(shotLabel).reduce((currentSum, currentValue) => currentSum + currentValue, 0);
    return sum;
}

function getDominantLabels() {
    const dominantLabels = [];
    videoAnnotations.annotation_results.forEach(r => {
        if (r.shot_label_annotations) {
            let fullVideoLength = calculateSegmentDuration(r.segment);
            console.log(`full video length: ${fullVideoLength}`);
            for (const shotLabel of r.shot_label_annotations) {
                const categories = (shotLabel.category_entities ?? []).map(e => e.description).join(', ');
                let fullLabelDuration = getFullDuration(shotLabel);
                let labelRatio = fullLabelDuration / fullVideoLength;
                if (labelRatio > 0.1) {
                    dominantLabels.push({
                        label: shotLabel.entity.description,
                        categories,
                        fullLabelDuration,
                        labelRatio
                    })
                }
            }
        }
    });
    return dominantLabels;
}

const labelIndex = {};

function indexLabels() {
    videoAnnotations.annotation_results.forEach(r => {
        if (r.shot_label_annotations) {
            for (const shotLabel of r.shot_label_annotations) {
                const longEnoughSegments = shotLabel.segments.filter(s => calculateSegmentDuration(s.segment) >= 1);
                longEnoughSegments.forEach(s => {
                    if (!labelIndex[shotLabel.entity.description]) {
                        labelIndex[shotLabel.entity.description] = [];
                    }
                    labelIndex[shotLabel.entity.description].push({
                        label: shotLabel.entity.description,
                        timeStamp: convertTimestampToNumber(s.segment.start_time_offset),
                        duration: calculateSegmentDuration(s.segment)
                    })
                });
            }
        }
    });
}

function searchTimestampsForLabel(searchText) {
    return Object.entries(labelIndex).filter(([key]) => key.includes(searchText)).flatMap(([key, info]) => info);
}

function main() {
    // getDominantLabels().forEach(l => {
    //     console.log(`${l.label} ${l.categories.length > 0 ? `(${l.categories})` : ''}: ${l.fullLabelDuration} (${l.labelRatio * 100}%)`);
    // });
    indexLabels();
    console.log(JSON.stringify(searchTimestampsForLabel('crossing'), null, 2));
}

main();

//
// "shot_label_annotations": [ {
//     "entity": {
//         "entity_id": "/m/03c31",
//         "description": "graphic design",
//         "language_code": "en-US"
//     },
//     "category_entities": [ {
//         "entity_id": "/m/0dgsmq8",
//         "description": "artwork",
//         "language_code": "en-US"
//     } ],