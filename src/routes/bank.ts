import { FastifyPluginAsync } from "fastify";
import { getBankExport } from "../utils/bankExport";

const bankRoutes: FastifyPluginAsync = async (app) => {
  app.get("/bank/export", async (request) => {
    return getBankExport(request.user.id);
  });
};

export default bankRoutes;
