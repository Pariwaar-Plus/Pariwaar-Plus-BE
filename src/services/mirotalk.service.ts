export const createMiroTalkJoinUrl = async ({
    room,
    name,
}: {
    room: string;
    name: string;
}) => {
    const response = await fetch(
        `${process.env.MIROTALK_URL}/api/v1/join`,
        {
            method: "POST",
            headers: {
                authorization:
                    process.env.MIROTALK_API_SECRET!,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                room,
                name,
            }),
        }
    );

    if (!response.ok) {
        throw new Error(
            `MiroTalk error: ${response.status}`
        );
    }

    const data = await response.json();

    return data.join;
};