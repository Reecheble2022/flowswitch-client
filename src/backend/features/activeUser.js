const ACTIVE_USER_KEY = "REECH_CURRENT_USER";
export const getExistingActiveUser = async () => {
    try {
        const activeUserString = localStorage.getItem(ACTIVE_USER_KEY);
        if (!activeUserString) {
            throw new Error("Active business user not found");
        }

        const activeUserObject = JSON.parse(activeUserString);

        if (
            typeof activeUserObject?.phone !== "string" ||
            typeof activeUserObject?.firstname !== "string"
        ) { throw new Error("Unexpected shape of active business user data"); }

        return activeUserObject;

    } catch (error) {
        return { id: 0 };
    }
};
