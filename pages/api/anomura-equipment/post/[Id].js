import { createEquipment, getAllAnomuraPartImages, getAnomuraEquipmentById, getAnomuraPartImageByName, updateAnomuraEquipmentImageById } from "repositories/anomura-equipment";

import authMiddleware from "middlewares/authMiddleware";

// update / create equipment image
const EquipmentImageViewerUpdate = async (req, res) => {

    try {
        const {
            data: { name, equipmentType, blockNumber },
        } = req.body;

        console.log(`Try creating an anomura equipment...`);

        const equipmentId = parseInt(req.query.Id);
        const anomuraPartImages = await getAllAnomuraPartImages()
        let index = anomuraPartImages.findIndex(part => name.includes(part.name))

        if (index === -1) {
            return res.status(200).json({ message: "cannot find image", isError: true });
        }

        // then use the image to save into AnomuraEquipment table
        const anomuraEquipment = await getAnomuraEquipmentById(equipmentId)

        if (anomuraEquipment && anomuraEquipment?.lastUpdatedAtBlock != null && anomuraEquipment.lastUpdatedAtBlock >= blockNumber) {
            return res.status(200).json({ message: `No update as this block of this NEW EQUIPMENT event is less than or equal to last updated record` })
        }

        if (anomuraEquipment) {

            if (anomuraEquipment.image !== anomuraPartImages[index].url) {
                console.log(`Updating existing equipment with image`);
                await updateAnomuraEquipmentImageById({
                    equipmentId,
                    image: anomuraPartImages[index].url
                });
            }
            return res.status(200).json({ message: `A new equipment ${equipmentId} is created` });
        }
        else {
            await createEquipment({
                equipmentId,
                name,
                equipmentType: parseInt(equipmentType),
                image: anomuraPartImages[index].url,
                blockNumber
            });

            return res.status(200).json({ message: `A new equipment ${equipmentId} is created` });
        }
    }
    catch (err) {
        console.log(err)
        res.status(500).json({ message: err.message });
    }
}

export default authMiddleware(EquipmentImageViewerUpdate)