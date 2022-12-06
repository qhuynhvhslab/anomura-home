import { prisma, equipmentType as EquipmentType } from "./PrismaContext";

export const getAnomuraEquipmentById = async (equipmentId) => {
    return await prisma.anomuraEquipment.findUnique({
        where: {
            equipmentId: parseInt(equipmentId),
        },
    });
};

export const getAnomuraPartImageByName = async (equipmentName) => {
    return await prisma.anomuraPartImage.findUnique({
        where: {
            name: equipmentName,
        },
    });
};

export const getAllAnomuraPartImages = async () => {
    return await prisma.anomuraPartImage.findMany();
};

export const equipEquipmentToAnomura = async (equipmentId, anomuraId, blockNumber) => {
    return await prisma.anomuraEquipment.update({
        where: {
            equipmentId: parseInt(equipmentId)
        },
        data: {
            isEquipped: true,
            anomura: {
                connect: {
                    crabId: parseInt(anomuraId)
                }
            },
            lastUpdatedAtBlock: blockNumber
        }
    })
}

export const unEquipFromAnomura = async (equipmentId, anomuraId, blockNumber) => {
    return await prisma.anomuraEquipment.update({
        where: {
            equipmentId: parseInt(equipmentId)
        },
        data: {
            isEquipped: false,
            lastUpdatedAtBlock: blockNumber,
            anomura: {
                disconnect: true
            }
        }
    })
}


export const updateAnomuraEquipmentImageById = async ({ equipmentId, image }) => {

    return await prisma.anomuraEquipment.update(
        {
            where: {
                equipmentId
            },
            data: {
                image
            },
        });
};

export const createEquipment = async ({ equipmentId, name, equipmentType, image, blockNumber }) => {

    let type;
    switch (equipmentType) {
        case 0:
            type = EquipmentType.CLAWS;
            break;
        case 1:
            type = EquipmentType.LEGS;
            break;
        case 2:
            type = EquipmentType.BODY;
            break;
        case 3:
            type = EquipmentType.SHELL;
            break;
        case 4:
            type = EquipmentType.HEADPIECES;
            break;
        default:
            throw new Error("Incorrect equipment type passed in")
    }
    return await prisma.anomuraEquipment.create({
        data: {
            equipmentId,
            name,
            type,
            image,
            lastUpdatedAtBlock: blockNumber
        },
    });
};
