const validName = value => typeof value === 'string' && value.trim().length > 0 && value.length <= 120 && !/[\x00-\x1f]/.test(value);
const validPath = value => typeof value === 'string' && value.length > 0 && value.length <= 500 && !/[\\\x00-\x1f]/.test(value) && value.split('/').every(part=>part && part!=='.' && part!=='..');
const validContent = value => typeof value === 'string' && !value.includes('\0') && Buffer.byteLength(value) <= 1048576;
const validSnapshot = files => files && typeof files === 'object' && !Array.isArray(files) && Object.keys(files).length <= 200 && Object.entries(files).every(([path,content])=>validPath(path) && validContent(content));
module.exports={validName,validPath,validContent,validSnapshot};
