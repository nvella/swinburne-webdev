using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;

// For more information on enabling MVC for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace Class2_folio.Models
{
    public class AdminMessage
    {
        public int ID { get; set; }
        public DateTime DateCreated { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
        public string MessageText { get; set; }

        public AdminMessage()
        {
            this.DateCreated = DateTime.Now;
            // this is a test
        }
    }
}
