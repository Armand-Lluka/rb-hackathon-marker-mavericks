const fs = require('fs/promises');

const videoAnnotations = [];
async function readData() {
    const files = await fs.readdir('./data');
    await Promise.all(files.map(async (file) => {
        const fileContent = await fs.readFile(`./data/${file}`, null, 'utf-8');
        videoAnnotations.push(JSON.parse(fileContent));
    }));
}


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
    videoAnnotations.forEach(va => {
        va.annotation_results.forEach(r => {
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
    });
    return dominantLabels;
}

const labelIndex = {};

function indexLabels() {
    videoAnnotations.forEach(va => {
        va.annotation_results.forEach(r => {
            if (r.shot_label_annotations) {
                const fileName = r.input_uri;
                for (const shotLabel of r.shot_label_annotations) {
                    const longEnoughSegments = shotLabel.segments.filter(s => calculateSegmentDuration(s.segment) >= 1);
                    longEnoughSegments.forEach(s => {
                        if (!labelIndex[shotLabel.entity.description]) {
                            labelIndex[shotLabel.entity.description] = [];
                        }
                        labelIndex[shotLabel.entity.description].push({
                            file: fileName,
                            label: shotLabel.entity.description,
                            timeStamp: convertTimestampToNumber(s.segment.start_time_offset),
                            duration: calculateSegmentDuration(s.segment)
                        })
                    });
                }
            }
        });
    });
}

function searchTimestampsForLabel(searchText) {
    return Object.entries(labelIndex).filter(([key]) => key.includes(searchText)).flatMap(([key, info]) => info);
}

async function main() {
    await readData();
    indexLabels();
    // getDominantLabels().forEach(l => {
    //     console.log(`${l.label} ${l.categories.length > 0 ? `(${l.categories})` : ''}: ${l.fullLabelDuration} (${l.labelRatio * 100}%)`);
    // });
    console.log(JSON.stringify(searchTimestampsForLabel('river'), null, 2));
}

main().catch(e => process.exit(1));