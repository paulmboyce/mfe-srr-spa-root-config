import { LOAD_ERROR } from "single-spa";

export const stubAppFailedToLoad = {
  status: LOAD_ERROR,
  bootstrap: () => {
    return new Promise((resolve, reject) => {
      reject(new Error(`Unable to bootstrap app ${name}`));
    });
  },

  mount: () => {
    return new Promise((resolve, reject) => {
      reject(new Error(`Unable to mount app ${name}`));
    });
  },
  unmount: () => {
    return new Promise((resolve, reject) => {
      reject(new Error(`Unable to unmount app ${name}`));
    });
  },
};
