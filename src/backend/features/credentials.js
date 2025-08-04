export const getExistingUserCredentials = async (localStorageKey) => {
  try {
    let userCredentialsObject = localStorage.getItem(localStorageKey);
    if (!userCredentialsObject) {
      throw new Error("Crendetials not found");
    }
    return userCredentialsObject;
  } catch (error) {
    console.warn("Error occured while reading existing tokens, defaulting to empty strings := ", error)
    return {};
  }
};


