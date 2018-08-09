using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using Class2_folio.Models;

namespace Class2_folio.Controllers
{
    public class AdminMessagesController : Controller
    {
        private readonly AdminMessageContext _context;

        public AdminMessagesController(AdminMessageContext context)
        {
            _context = context;    
        }

        // GET: AdminMessages
        public async Task<IActionResult> Index()
        {
            return View(await _context.AdminMessage.ToListAsync());
        }

        // GET: AdminMessages/Details/5
        public async Task<IActionResult> Details(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var adminMessage = await _context.AdminMessage
                .SingleOrDefaultAsync(m => m.ID == id);
            if (adminMessage == null)
            {
                return NotFound();
            }

            return View(adminMessage);
        }

        // GET: AdminMessages/Create
        public IActionResult Create()
        {
            return View();
        }

        // POST: AdminMessages/Create
        // To protect from overposting attacks, please enable the specific properties you want to bind to, for 
        // more details see http://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create([Bind("ID,DateCreated,Name,Email,MessageText")] AdminMessage adminMessage)
        {
            if (ModelState.IsValid)
            {
                _context.Add(adminMessage);
                await _context.SaveChangesAsync();
                return RedirectToAction("Index");
            }
            return View(adminMessage);
        }

        // GET: AdminMessages/Edit/5
        public async Task<IActionResult> Edit(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var adminMessage = await _context.AdminMessage.SingleOrDefaultAsync(m => m.ID == id);
            if (adminMessage == null)
            {
                return NotFound();
            }
            return View(adminMessage);
        }

        // POST: AdminMessages/Edit/5
        // To protect from overposting attacks, please enable the specific properties you want to bind to, for 
        // more details see http://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(int id, [Bind("ID,DateCreated,Name,Email,MessageText")] AdminMessage adminMessage)
        {
            if (id != adminMessage.ID)
            {
                return NotFound();
            }

            if (ModelState.IsValid)
            {
                try
                {
                    _context.Update(adminMessage);
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateConcurrencyException)
                {
                    if (!AdminMessageExists(adminMessage.ID))
                    {
                        return NotFound();
                    }
                    else
                    {
                        throw;
                    }
                }
                return RedirectToAction("Index");
            }
            return View(adminMessage);
        }

        // GET: AdminMessages/Delete/5
        public async Task<IActionResult> Delete(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var adminMessage = await _context.AdminMessage
                .SingleOrDefaultAsync(m => m.ID == id);
            if (adminMessage == null)
            {
                return NotFound();
            }

            return View(adminMessage);
        }

        // POST: AdminMessages/Delete/5
        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteConfirmed(int id)
        {
            var adminMessage = await _context.AdminMessage.SingleOrDefaultAsync(m => m.ID == id);
            _context.AdminMessage.Remove(adminMessage);
            await _context.SaveChangesAsync();
            return RedirectToAction("Index");
        }

        private bool AdminMessageExists(int id)
        {
            return _context.AdminMessage.Any(e => e.ID == id);
        }
    }
}
