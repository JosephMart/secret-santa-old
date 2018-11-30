export function guidGenerator() {
  const S4 = function () {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
  };
  return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
}

export function getOptions(currentId, all) {
  return all
    .filter(u => (
      u.id !== currentId && u.name !== ""
    ))
    .map(u => ({
      value: u.id, label: u.name,
    }));
}

export function getSelectValues(noMatch, all) {
  return all
    .filter(i => noMatch.includes(i.id))
    .map(i => ({
      label: i.name,
      value: i.id,
    }));
}
