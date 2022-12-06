import {
    createEquipment,
    equipEquipmentToAnomura,
    getAllAnomuraPartImages,
    getAnomuraEquipmentById,
    getAnomuraPartImageByName,
    unEquipFromAnomura,
    updateAnomuraEquipmentImageById
} from "repositories/anomura-equipment";

import { getAnomuraById } from "repositories/crabs";

import authMiddleware from "middlewares/authMiddleware";

// equip to Anomura
const AnomuraUnequipItemAPI = async (req, res) => {

    try {
        const {
            data: { equipmentId, anomuraId, blockNumber },
        } = req.body;

        console.log(`Try unequipping an anomura equipment`);

        // check if equipmentId, anomuraId existed and equipment is not equipped to any anomura
        const thisEquipment = await getAnomuraEquipmentById(equipmentId)
        const thisAnomura = await getAnomuraById(anomuraId)

        if (!thisEquipment || !thisAnomura) {
            return res.status(200).json({ message: "Equipment or Anomura not existed", isError: true })
        }
        if (!thisEquipment.isEquipped || (thisEquipment.hasOwnProperty("equipToAnomura") && thisEquipment.equipToAnomura == null)) {
            return res.status(200).json({ message: `Equipment is not currently equipped to Anomura `, isError: true })
        }
        if (thisEquipment.equipToAnomura != anomuraId) {
            return res.status(200).json({ message: `Another equipment is currently equipped to this Anomura `, isError: true })
        }
        if (thisEquipment.lastUpdatedAtBlock != null && thisEquipment.lastUpdatedAtBlock >= blockNumber) {
            return res.status(200).json({ message: `No update as this block of this UNEQUIP event is less than or equal to last updated record` })
        }

        await unEquipFromAnomura(equipmentId, anomuraId, blockNumber)

        return res.status(200).json({ message: `Unequip Operation for Id ${equipmentId} from anomura ${anomuraId} finished!` });
    }
    catch (err) {
        console.log(err)
        res.status(200).json({ message: err.message });
    }
}

export default authMiddleware(AnomuraUnequipItemAPI)