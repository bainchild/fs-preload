if game~=nil then return end
local gg = custom_require("/../mod/gg.lua","pm")
local tree = gg.new()
local game = tree:GetFirstInstanceMatchingFilter(function(f)return f.ClassName=="DataModel"end)
PM._G.ROBLOX_INSTANCE_TREE=tree
PM._G.game=game
PM._G.workspace=game:GetService("Workspace")
PM._G.typeof=tree.typeof
for _,v in pairs(custom_require("mod/robloxtypes4.lua","pm")) do
   if v.Global then
      PM._G[v.GlobalKey]=v.Lib
   end
end