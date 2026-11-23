export function createChunkIndex(chunks){
 const byModule=new Map(chunks.flatMap(c=>c.moduleIds.map(id=>[id,c])));
 return {chunks,byModule,query(bounds){return chunks.filter(c=>c.bounds.minX<=bounds.maxX&&c.bounds.maxX>=bounds.minX&&c.bounds.minZ<=bounds.maxZ&&c.bounds.maxZ>=bounds.minZ);},visible(intersects,selected){const chosen=byModule.get(selected);return chunks.filter(c=>c===chosen||intersects(c));}};
}
