export function addFile(data: { [x: string]: { __filename: any; }; }, filePath = '', isFolder = false) {
  // 找到根目录
  function findRootKey(data: { [x: string]: { __filename: any; }; }, filePath: string) {
    for (const key in data) {
      if (data[key].__filename && filePath.startsWith(data[key].__filename)) {
        return key;
      }
    }
    throw new Error('No matching root key found for the file path.');
  }

  // 递归插入路径
  function insertPath(obj: { [x: string]: any; __filename: any; }, keys: any[], fullPath: string, isFolder: boolean) {
    const key = keys.shift();

    if (keys.length === 0) {
      if (isFolder) {
        // 处理文件夹
        if (!obj[key]) {
          obj[key] = { __filename: fullPath };
        }
      } else {
        // 处理文件
        obj[key] = fullPath;
      }
      return;
    }

    // 如果是子目录，确保存在对象并带有 __filename
    if (!obj[key]) {
      const currentPath = `${obj.__filename}/${key}`;
      obj[key] = { __filename: currentPath };
    }

    // 递归处理下一级
    insertPath(obj[key], keys, fullPath, isFolder);
  }

  // 找到所属的顶层根目录
  const rootKey = findRootKey(data, filePath);
  const root = data[rootKey];
  const relativePath = filePath.slice(root.__filename.length + 1); // 获取相对路径
  const parts = relativePath.split('/');

  insertPath(root, parts, filePath, isFolder);
  return data;
}

export function deleteFile(data: { [x: string]: any; }, filePath: string) {
  // 找到根目录
  function findRootKey(data: { [x: string]: { __filename: any; }; }, filePath: string) {
    for (const key in data) {
      if (data[key].__filename && filePath.startsWith(data[key].__filename)) {
        return key;
      }
    }
    throw new Error('No matching root key found for the file path.');
  }

  // 递归删除路径
  function deletePath(obj: { [x: string]: any; }, keys: any[]) {
    if (!keys.length) {
      throw new Error('Path is empty or invalid.');
    }

    const key = keys.shift();

    if (!obj[key]) {
      throw new Error(`Path "${key}" not found in the data structure.`);
    }

    if (keys.length === 0) {
      // 到达目标，删除键
      delete obj[key];
      return;
    }

    // 继续递归删除子路径
    deletePath(obj[key], keys);

    // 如果删除后该目录为空，移除目录
    if (Object.keys(obj[key]).length === 1 && '__filename' in obj[key]) {
      delete obj[key];
    }
  }

  // 找到所属的顶层根目录
  const rootKey = findRootKey(data, filePath);
  const root = data[rootKey];

  // 判断是否要删除整个 rootKey
  if (root.__filename === filePath) {
    // 删除整个 rootKey
    delete data[rootKey];
    return data;
  }

  const relativePath = filePath.slice(root.__filename.length + 1); // 获取相对路径
  const parts = relativePath.split('/').filter(Boolean); // 确保路径数组有效

  deletePath(root, parts);
  return data;
}

export function renameFile(data: { [x: string]: any; }, oldPath: string, newName: string | number) {
  // 找到根目录
  function findRootKey(data: { [x: string]: { __filename: any; }; }, filePath: string) {
    for (const key in data) {
      if (data[key].__filename && filePath.startsWith(data[key].__filename)) {
        return key;
      }
    }
    throw new Error('No matching root key found for the file path.');
  }

  // 递归更新文件夹路径
  function updatePaths(obj: { [x: string]: any; }, parentPath: string) {
    for (const key in obj) {
      if (key === '__filename') {
        obj[key] = parentPath;
      } else if (typeof obj[key] === 'string') {
        obj[key] = `${parentPath}/${key}`;
      } else if (typeof obj[key] === 'object') {
        const newParentPath = `${parentPath}/${key}`;
        updatePaths(obj[key], newParentPath);
      }
    }
  }

  // 找到所属的顶层根目录
  const rootKey = findRootKey(data, oldPath);
  const root = data[rootKey];

  // 获取相对路径
  const relativePath = oldPath.slice(root.__filename.length + 1); // 获取相对路径
  const parts = relativePath.split('/').filter(Boolean); // 确保路径数组有效

  let target = root;
  let parent = null;
  let keyToRename = null;

  // 遍历路径，找到目标位置
  for (const part of parts) {
    if (!target[part]) {
      throw new Error(`Path "${part}" not found in the data structure.`);
    }
    parent = target;
    keyToRename = part;
    target = target[part];
  }

  // 重命名操作
  if (!parent || !keyToRename) {
    throw new Error('Cannot rename root or invalid path.');
  }

  // 更新父级对象的键名
  parent[newName] = target;
  delete parent[keyToRename];

  // 更新路径
  const newPath = `${parent.__filename || root.__filename}/${newName}`;
  if (typeof target === 'object') {
    updatePaths(target, newPath);
  } else {
    parent[newName] = newPath;
  }
  return data;
}