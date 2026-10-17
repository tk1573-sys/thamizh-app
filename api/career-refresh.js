import { discoverCareerJobs } from "../src/career-refresh-core.mjs";

export default async function handler(req,res) {
  if(req.method!=="GET" && req.method!=="POST") {
    res.setHeader("Allow","GET, POST");
    return res.status(405).json({error:"Method not allowed"});
  }
  try {
    const result=await discoverCareerJobs();
    res.setHeader("Cache-Control","no-store");
    return res.status(result.sources.some(s=>s.status==="ok")?200:502).json(result);
  } catch(error) {
    return res.status(502).json({error:"Career source refresh failed",message:String(error?.message||error)});
  }
}
