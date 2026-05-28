import { Prisma } from "@prisma/client";

export async function generateEmployeeId(
    tx: Prisma.TransactionClient
): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = "SAH";

    const lastAgent = await tx.careAgent.findFirst({
        where: {
            employeeId: {
            startsWith: `${prefix}-${year}`,
            },
        },
        orderBy: {
            employeeId: "desc",
        },
        select: {
            employeeId: true,
        },
    });

    let sequence = 1;

    if (lastAgent?.employeeId) {
        const lastSequence = parseInt(
            lastAgent.employeeId.split("-")[2],
            10
        );

        sequence = lastSequence + 1;
    }

    return `${prefix}-${year}-${sequence
        .toString()
        .padStart(3, "0")}`;
}