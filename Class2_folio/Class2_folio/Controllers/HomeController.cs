using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;


using Class2_folio.Models;

namespace Class2_folio.Controllers
{
    public class HomeController : Controller
    {
        private AdminMessageContext _context;

        public HomeController(AdminMessageContext context)
        {
            _context = context;
        }


        public IActionResult Index()
        {
            return View();
        }

        public IActionResult Error()
        {
            return View();
        }

        [HttpPost]
        public async Task<IActionResult> Index(IFormCollection values)
        {
            

            AdminMessage msg = new AdminMessage();
            msg.Name = values["name"];
            msg.Email = values["email"];
            msg.MessageText = values["msg"];

            _context.Add(msg);
            await _context.SaveChangesAsync();

            return View();
        }
    }
}
